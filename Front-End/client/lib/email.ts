export type SendEmailPayload = {
    to: string;
    subject: string;
    html?: string;
    text?: string;
};

const EMAIL_ENDPOINT = "http://localhost:8084/api/email/send";

export async function sendAlertEmail(payload: SendEmailPayload): Promise<boolean> {
    try {
        const res = await fetch(EMAIL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            console.warn("Email send failed:", await res.text());
            return false;
        }
        return true;
    } catch (e) {
        console.warn("Email send error:", e);
        return false;
    }
}
