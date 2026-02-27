import { getRequestContext } from "@cloudflare/next-on-pages";

export async function sendAdminNotification(type: 'free' | 'premium', details?: any) {
    try {
        const env = getRequestContext().env as any;
        const apiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;

        if (!apiKey) {
            console.error("CRITICAL: BREVO_API_KEY is missing in environment variables. Cannot send notification.");
            return;
        }

        const notificationTypeStr = type === 'premium' ? 'Premium 🌟' : 'Gratuite 🔮';

        const htmlContent = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h1 style="color: #9d4edd; text-align: center;">Nouvelle Consultation Lignes de la Main</h1>
                <p style="font-size: 16px;">Une nouvelle lecture <strong>${notificationTypeStr}</strong> vient d'être générée sur le site !</p>
                <p style="font-size: 14px; color: #666;">Date: ${new Date().toLocaleString('fr-FR')}</p>
                ${details ? `<p style="font-size: 12px; color: #888;">Détails techniques : <br><pre>${JSON.stringify(details, null, 2)}</pre></p>` : ''}
            </div>
        `;

        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                "accept": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: "Lignes de la Main - Notifications",
                    email: "contact@liremamain.fr"
                },
                to: [
                    {
                        email: "armurias34@gmail.com"
                    }
                ],
                subject: `Nouvelle lecture ${notificationTypeStr} sur liremamain.fr`,
                htmlContent: htmlContent
            })
        });

        if (!brevoResponse.ok) {
            const errorData = await brevoResponse.json();
            console.error("Brevo API Error (Admin Notify):", JSON.stringify(errorData, null, 2));
        }

    } catch (error) {
        console.error("Admin Notify Error:", error);
    }
}
