// Setup type definitions for Deno
// import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json()
        console.log("Fetching metadata for:", url);

        if (!url) {
            throw new Error("URL is required")
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.google.com/'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch site: ${response.status} ${response.statusText}`);
        }

        const html = await response.text()
        const $ = cheerio.load(html)
        console.log("Page Title from HTML tag:", $('title').text());

        // Helper to resolve relative URLs
        const resolveUrl = (relativeUrl) => {
            if (!relativeUrl) return '';
            try {
                return new URL(relativeUrl, url).href;
            } catch (e) {
                return relativeUrl;
            }
        }

        // --- EXTRACT TITLE ---
        // Mercado Libre specific: h1.ui-pdp-title
        // Amazon specific: #productTitle
        let title =
            $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('h1.ui-pdp-title').first().text() || // ML
            $('#productTitle').text().trim() || // Amazon
            $('h1').first().text() ||
            $('title').text() ||
            '';

        // Cleanup title (remove " | Mercado Livre", " - Amazon.com.br", etc)
        title = title.replace(/ \| Mercado Livre.*/, '').replace(/ : Amazon\.com\.br.*/, '').trim();

        // --- EXTRACT IMAGE ---
        let image = null;
        let imageSource = '';

        // Strategy 0: JSON-LD (Often most reliable for E-commerce)
        $('script[type="application/ld+json"]').each((i, el) => {
            if (image) return;
            try {
                const json = JSON.parse($(el).html());
                const items = Array.isArray(json) ? json : [json];

                for (const item of items) {
                    if (item['@type'] === 'Product' && item.image) {
                        if (Array.isArray(item.image)) image = item.image[0];
                        else if (typeof item.image === 'object') image = item.image.url || item.image;
                        else image = item.image;
                        imageSource = 'JSON-LD Product';
                        break;
                    }
                }
            } catch (e) { }
        });

        // Strategy 1: Open Graph
        if (!image) {
            image = $('meta[property="og:image"]').attr('content');
            if (image) imageSource = 'Open Graph';
        }

        // Strategy 2: Twitter Card
        if (!image) {
            image = $('meta[name="twitter:image"]').attr('content');
            if (image) imageSource = 'Twitter Card';
        }

        // Strategy 3: Specific Selectors
        if (!image) {
            // Amazon Dynamic Image
            const amznDynamic = $('#landingImage').attr('data-a-dynamic-image') || $('.a-dynamic-image').attr('data-a-dynamic-image');
            if (amznDynamic) {
                try {
                    const images = JSON.parse(amznDynamic);
                    image = Object.keys(images)[0]; // First key is URL
                    imageSource = 'Amazon Dynamic';
                } catch (e) { }
            }

            // Amazon Static
            if (!image) {
                image = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
                if (image) imageSource = 'Amazon Static';
            }

            // Mercado Livre
            if (!image) {
                // New ML layout uses distinct classes
                image = $('img.ui-pdp-image').first().attr('src') ||
                    $('figure.ui-pdp-gallery__figure > img').first().attr('src');
                if (image) imageSource = 'Mercado Livre DOM';
            }
        }

        // Strategy 4: Link Rel
        if (!image) {
            image = $('link[rel="image_src"]').attr('href');
        }

        if (image) {
            image = resolveUrl(image);
            console.log(`Image found via: ${imageSource}`);
        } else {
            console.log('No image found.');
        }

        // --- EXTRACT DESCRIPTION ---
        const description =
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            '';

        // --- EXTRACT PRICE ---
        let price = null;
        let priceSource = '';

        // Strategy 1: Meta Itemprop (ML Standard)
        const metaPrice = $('meta[itemprop="price"]').attr('content');
        if (metaPrice) {
            price = parseFloat(metaPrice);
            priceSource = 'Meta Itemprop';
        }

        // Strategy 2: JSON-LD Price
        if (!price) {
            $('script[type="application/ld+json"]').each((i, el) => {
                if (price) return;
                try {
                    const json = JSON.parse($(el).html());
                    const items = Array.isArray(json) ? json : [json];
                    for (const item of items) {
                        if (item['@type'] === 'Product' && item.offers) {
                            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                            if (offer.price) {
                                price = parseFloat(offer.price);
                                priceSource = 'JSON-LD';
                                break;
                            }
                        }
                    }
                } catch (e) { }
            });
        }

        // Strategy 3: Open Graph / Twitter Data
        if (!price) {
            const ogPrice = $('meta[property="product:price:amount"]').attr('content') ||
                $('meta[property="og:price:amount"]').attr('content') ||
                $('meta[name="twitter:data1"]').attr('content'); // Often price
            if (ogPrice) {
                // Check if twitter data is actually currency
                const clean = ogPrice.replace(/[^\d.,]/g, '').replace(',', '.');
                if (!isNaN(parseFloat(clean))) {
                    price = parseFloat(clean);
                    priceSource = 'OG/Twitter';
                }
            }
        }

        // Strategy 4: DOM Price Fallbacks (Last Resort)
        if (!price) {
            // Amazon
            const amznPrice = $('.a-price .a-offscreen').first().text() || $('#priceblock_ourprice').text();

            // Mercado Livre DOM - Strict Selector for Main Price
            // .ui-pdp-price__second-line is usually the main price container (above installments)
            // We select the first money amount fraction in that specific container.
            const mlPrice = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text();

            const rawPrice = amznPrice || mlPrice;
            if (rawPrice) {
                const clean = rawPrice.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
                price = parseFloat(clean);
                priceSource = 'DOM Fallback';
            }
        }

        // Generic Fallback (Very Risky - Body Regex)
        if (!price) {
            const bodyText = $('body').text().slice(0, 100000);
            // Look for "R$ 1.234,56" but try to avoid small numbers that look like installments (e.g. 12x 123)
            // This is weak, so we rely on headers mainly.
            const priceMatch = bodyText.match(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/);

            if (priceMatch && priceMatch[1]) {
                const cleanPrice = priceMatch[1].replace(/\./g, '').replace(',', '.');
                price = parseFloat(cleanPrice);
                priceSource = 'Beast Mode Regex';
            }
        }

        console.log(`Price found: ${price} via ${priceSource}`);

        const data = {
            title: title ? title.trim() : '',
            image: image ? image.trim() : '',
            description: description ? description.trim() : '',
            price: price
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
