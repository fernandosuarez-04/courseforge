'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPublicationData(artifactId: string) {
    const supabase = await createClient();

    // 1. Get Artifact basic info
    const { data: artifact, error: artError } = await supabase
        .from('artifacts')
        .select('id, idea_central, generation_metadata')
        .eq('id', artifactId)
        .single();

    if (artError || !artifact) {
        throw new Error('Artifact not found');
    }

    // 2. Get Lessons for this artifact (from material_lessons)
    // We need to join with materials -> material_lessons
    const { data: materials, error: matError } = await supabase
        .from('materials')
        .select('id')
        .eq('artifact_id', artifactId)
        .single();

    let lessons: any[] = [];
    if (materials) {
        const { data: rawLessons } = await supabase
            .from('material_lessons')
            .select(`
                lesson_id, 
                lesson_title, 
                module_title,
                material_components(
                    type,
                    assets
                )
            `)
            .eq('materials_id', materials.id)
            .order('lesson_id');

        if (rawLessons) {
            lessons = rawLessons.map((l: any) => {
                // Try to find a video URL in components
                let videoUrl = '';
                if (l.material_components && Array.isArray(l.material_components)) {
                    // Prioritize final_video_url, then video_url
                    const videoComp = l.material_components.find((c: any) =>
                        c.assets?.final_video_url || c.assets?.video_url
                    );
                    if (videoComp) {
                        videoUrl = videoComp.assets.final_video_url || videoComp.assets.video_url;
                    }
                }

                return {
                    id: l.lesson_id,
                    title: l.lesson_title,
                    module_title: l.module_title,
                    auto_video_url: videoUrl
                };
            });
        }
    }


    // 3. Get existing publication request if any
    const { data: request } = await supabase
        .from('publication_requests')
        .select('*')
        .eq('artifact_id', artifactId)
        .single();

    console.log(`[getPublicationData] Artifact: ${artifactId}`);
    console.log(`[getPublicationData] Request found: ${!!request}`);
    if (request?.lesson_videos) {
        const keys = Object.keys(request.lesson_videos);
        console.log(`[getPublicationData] Video Mappings: ${keys.length}`);
        if (keys.length > 0) {
            console.log(`[getPublicationData] Sample Duration: ${request.lesson_videos[keys[0]].duration}`);
        }
    }

    return {
        artifact: {
            id: artifact.id,
            title: artifact.idea_central
        },
        lessons,
        request
    };
}

export async function savePublicationDraft(artifactId: string, data: any) {
    const supabase = await createClient();
    try {
        console.log('--- SAVE DRAFT START ---');

        const { data: existing } = await supabase
            .from('publication_requests')
            .select('id')
            .eq('artifact_id', artifactId)
            .single();

        if (existing) {
            console.log('Updating existing request:', existing.id);
            const { error } = await supabase
                .from('publication_requests')
                .update({
                    category: data.category,
                    level: data.level,
                    instructor_email: data.instructor_email,
                    slug: data.slug,
                    price: data.price,
                    thumbnail_url: data.thumbnail_url,
                    lesson_videos: data.lesson_videos, // JSONB
                    status: data.status, // DRAFT or READY
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) {
                console.error('Update Error:', error);
                throw error;
            }
        } else {
            console.log('Inserting new request');
            const { error } = await supabase
                .from('publication_requests')
                .insert({
                    artifact_id: artifactId,
                    category: data.category,
                    level: data.level,
                    instructor_email: data.instructor_email,
                    slug: data.slug,
                    price: data.price,
                    thumbnail_url: data.thumbnail_url,
                    lesson_videos: data.lesson_videos,
                    status: data.status
                });

            if (error) {
                console.error('Insert Error:', error);
                throw error;
            }
        }

        console.log('Save successful, revalidating path...');
        revalidatePath(`/admin/artifacts/${artifactId}/publish`);
        return { success: true };
    } catch (error: any) {
        console.error('Save Draft Error:', error);
        return { success: false, error: error.message };
    }
}

export async function publishToSoflia(artifactId: string) {
    const supabase = await createClient();
    console.log(`[publishToSoflia] Starting publication for artifact: ${artifactId}`);

    try {
        // 1. Validate Config
        const MOCK_MODE = process.env.SOFLIA_MOCK_MODE === 'true';
        const API_URL = process.env.SOFLIA_API_URL;
        const API_KEY = process.env.SOFLIA_API_KEY;

        if (!MOCK_MODE && (!API_URL || !API_KEY)) {
            throw new Error("Configuración incompleta: Faltan variables de entorno SOFLIA_API_URL o SOFLIA_API_KEY");
        }

        // 2. Data Gathering
        const { request, lessons, artifact } = await getPublicationData(artifactId);

        if (!request || request.status !== 'READY') {
            throw new Error("El curso no está en estado 'READY' para publicar. Guarde el borrador primero.");
        }

        // 3. Payload Construction
        const payload = {
            source: {
                platform: 'courseforge',
                version: '1.0',
                artifact_id: artifactId
            },
            course: {
                title: artifact.title,
                description: artifact.title, // Use idea_central/title as description
                slug: request.slug,
                category: request.category,
                level: request.level,
                instructor_email: request.instructor_email,
                price: request.price || 0,
                thumbnail_url: request.thumbnail_url,
                is_published: false
            },
            modules: [] as any[]
        };

        // Group lessons by module
        const moduleMap = new Map<string, any[]>();
        lessons.forEach(l => {
            const modTitle = l.module_title || 'Módulo General'; // Fallback
            if (!moduleMap.has(modTitle)) {
                moduleMap.set(modTitle, []);
            }
            moduleMap.get(modTitle)?.push(l);
        });

        // Build Modules Array
        let moduleOrder = 1;
        for (const [modTitle, modLessons] of moduleMap.entries()) {
            const moduleObj = {
                title: modTitle,
                order_index: moduleOrder++,
                lessons: [] as any[]
            };

            let lessonOrder = 1;
            for (const l of modLessons) {
                // Get video data from request mapping
                const mapping = request.lesson_videos?.[l.id];

                // Determine video URL and ID
                let videoUrl = '';
                let videoId = '';
                let provider = 'youtube';

                if (mapping?.video_id) {
                    videoId = mapping.video_id;
                    provider = mapping.video_provider || 'youtube';

                    if (provider === 'youtube') videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    else if (provider === 'vimeo') videoUrl = `https://vimeo.com/${videoId}`;
                    else videoUrl = videoId; // Direct or other
                } else if (l.auto_video_url) {
                    videoUrl = l.auto_video_url;
                    // Try to extract ID from auto URL if missing in mapping
                    // (Though mapping should have covered it via Client defaults, but safe fallback)
                    // ... (Simplification: rely on mapping predominantly or use full URL as ID if direct)
                }

                moduleObj.lessons.push({
                    title: l.title,
                    order_index: lessonOrder++,
                    duration_seconds: mapping?.duration || 0,
                    video_url: videoUrl,
                    video_provider: provider,
                    video_provider_id: videoId || videoUrl, // Fallback to URL if no ID extracted
                    is_free: false,
                    content_blocks: []
                });
            }
            payload.modules.push(moduleObj);
        }

        console.log(`[publishToSoflia] Payload constructed. Slug: ${payload.course.slug}, Modules: ${payload.modules.length}`);

        let result;
        if (MOCK_MODE) {
            console.log('--- MOCK MODE ENABLED ---');
            console.log('Skipping actual API call. Payload that would be sent:', JSON.stringify(payload, null, 2));
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            result = { message: "Mock success", mock: true };
        } else {
            // 4. Send to Soflia
            const targetUrl = `${API_URL}/api/courses/import`;
            console.log(`[publishToSoflia] Sending to: ${targetUrl}`);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY || ''
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[publishToSoflia] API Error (${response.status}):`, errorText);
                throw new Error(`Error remoto (${response.status}): ${errorText.substring(0, 200)}`);
            }

            result = await response.json();
        }

        console.log('[publishToSoflia] Success:', result);

        // 5. Update Status locally
        await supabase
            .from('publication_requests')
            .update({
                status: 'SENT',
                updated_at: new Date().toISOString()
            })
            .eq('id', request.id);

        revalidatePath(`/admin/artifacts/${artifactId}/publish`);

        return { success: true, data: result };

    } catch (error: any) {
        console.error('[publishToSoflia] Validation/Exec Error:', error);
        return { success: false, error: error.message };
    }
}

// Helper to parse ISO 8601 duration (PT1H2M3S)
function parseISODuration(duration: string): number {
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 0;

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    return (hours * 3600) + (minutes * 60) + seconds;
}

export async function fetchVideoMetadata(url: string) {
    if (!url) return { duration: 0, title: '' };

    try {
        // VIMEO
        if (url.includes('vimeo.com')) {
            const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                return {
                    duration: data.duration, // Vimeo gives seconds
                    title: data.title
                };
            }
        }

        // YOUTUBE
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // We fetch the page body to find the meta tag
            const res = await fetch(url, {
                headers: {
                    // Masquerade as a browser to avoid some bot detection, though Youtube is strict
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const text = await res.text();

            // Look for <meta itemprop="duration" content="PT1M33S">
            const metaMatch = text.match(/itemprop="duration" content="([^"]+)"/);
            if (metaMatch && metaMatch[1]) {
                const seconds = parseISODuration(metaMatch[1]);
                // Title
                const titleMatch = text.match(/<title>([^<]*)<\/title>/);
                const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : '';
                return { duration: seconds, title };
            }

            // Fallback: videoDurationSeconds in JSON
            const jsonMatch = text.match(/"videoDurationSeconds":"(\d+)"/);
            if (jsonMatch && jsonMatch[1]) {
                const titleMatch = text.match(/<title>([^<]*)<\/title>/);
                const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : '';
                return { duration: parseInt(jsonMatch[1], 10), title };
            }
        }
    } catch (e) {
        console.error('Error fetching video metadata:', e);
    }

    return { duration: 0, title: '' };
}
