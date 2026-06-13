// api/send-notification.js
// Vercel serverless function
// Sends email notifications to admin@nestx.co.nz
// when new listings or conveyancer applications are submitted

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'admin@nestx.co.nz';
const FROM_EMAIL = 'notifications@nestx.co.nz';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { type, data } = req.body;

    let subject, html;

    if (type === 'new_listing') {
      subject = `🏡 New listing pending verification — ${data.address}`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0F6E56;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">NestX Admin</h1>
            <p style="color:#9FE1CB;margin:4px 0 0;font-size:14px;">New listing pending verification</p>
          </div>
          <div style="background:#f5f4f0;padding:24px;border-radius:0 0 10px 10px;">
            <h2 style="font-size:18px;margin:0 0 16px;color:#1a1a18;">New listing submitted</h2>

            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;width:40%">Address</td>
                <td style="padding:8px 0;font-weight:500;">${data.address}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Asking price</td>
                <td style="padding:8px 0;font-weight:500;">$${Number(data.price).toLocaleString('en-NZ')}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">RV claimed</td>
                <td style="padding:8px 0;font-weight:500;color:#0F6E56;">$${Number(data.rv).toLocaleString('en-NZ')} ← verify this</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Property type</td>
                <td style="padding:8px 0;">${data.property_type} · ${data.beds} bed · ${data.baths} bath</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Swap preference</td>
                <td style="padding:8px 0;">${data.swap_pref}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Contact name</td>
                <td style="padding:8px 0;">${data.contact_name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#767672;">Contact email</td>
                <td style="padding:8px 0;">${data.contact_email}</td>
              </tr>
            </table>

            <div style="margin-top:20px;padding:14px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e;">
              <strong>⚠️ Action required:</strong> Verify the RV of $${Number(data.rv).toLocaleString('en-NZ')} against council records before approving.
            </div>

            <a href="https://nestx.co.nz/pages/admin.html" style="display:inline-block;margin-top:20px;background:#0F6E56;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Review in admin panel →
            </a>

            <p style="margin-top:20px;font-size:12px;color:#767672;">
              This is an automated notification from NestX. Do not reply to this email.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'user_feedback') {
      subject = `⭐ NestX feedback — ${data.rating ? data.rating + '/5 stars' : 'no rating'} — ${data.address}`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0F6E56;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">NestX</h1>
            <p style="color:#9FE1CB;margin:4px 0 0;font-size:14px;">New user feedback received</p>
          </div>
          <div style="background:#f5f4f0;padding:24px;border-radius:0 0 10px 10px;">
            <h2 style="font-size:18px;margin:0 0 16px;color:#1a1a18;">Feedback from a sold lister</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;width:40%">Property sold</td>
                <td style="padding:8px 0;font-weight:500;">${data.address}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">User email</td>
                <td style="padding:8px 0;">${data.email}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Star rating</td>
                <td style="padding:8px 0;font-size:18px;">${data.rating ? '⭐'.repeat(data.rating) + ` (${data.rating}/5)` : 'No rating given'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#767672;vertical-align:top;">Testimonial</td>
                <td style="padding:8px 0;">${data.text || '<em style="color:#767672">No comment left</em>'}</td>
              </tr>
            </table>
          </div>
        </div>
      `;
    } else if (type === 'new_conveyancer') {
      subject = `⚖️ New conveyancer application — ${data.first_name} ${data.last_name}, ${data.firm}`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0F6E56;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">NestX Admin</h1>
            <p style="color:#9FE1CB;margin:4px 0 0;font-size:14px;">New conveyancer application</p>
          </div>
          <div style="background:#f5f4f0;padding:24px;border-radius:0 0 10px 10px;">
            <h2 style="font-size:18px;margin:0 0 16px;color:#1a1a18;">New conveyancer application</h2>

            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;width:40%">Name</td>
                <td style="padding:8px 0;font-weight:500;">${data.first_name} ${data.last_name}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Firm</td>
                <td style="padding:8px 0;font-weight:500;">${data.firm}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Region</td>
                <td style="padding:8px 0;">${data.city}, ${data.region}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Email</td>
                <td style="padding:8px 0;">${data.email}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">Phone</td>
                <td style="padding:8px 0;">${data.phone}</td>
              </tr>
              <tr style="border-bottom:1px solid #e0dfdb;">
                <td style="padding:8px 0;color:#767672;">NZLS number</td>
                <td style="padding:8px 0;font-weight:500;color:#0F6E56;">${data.law_society_num} ← verify this</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#767672;">Website</td>
                <td style="padding:8px 0;">${data.website || '—'}</td>
              </tr>
            </table>

            <div style="margin-top:20px;padding:14px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e;">
              <strong>⚠️ Action required:</strong> Verify NZLS membership number <strong>${data.law_society_num}</strong> at
              <a href="https://www.lawsociety.org.nz/find-a-lawyer/" style="color:#92400e;">lawsociety.org.nz</a> before approving.
            </div>

            <a href="https://nestx.co.nz/pages/admin.html" style="display:inline-block;margin-top:20px;background:#0F6E56;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Review in admin panel →
            </a>

            <p style="margin-top:20px;font-size:12px;color:#767672;">
              This is an automated notification from NestX. Do not reply to this email.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'listing_approved') {
      subject = `✅ Your NestX listing is now live — ${data.address}`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0F6E56;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">NestX</h1>
            <p style="color:#9FE1CB;margin:4px 0 0;font-size:14px;">Your listing is live!</p>
          </div>
          <div style="background:#f5f4f0;padding:24px;border-radius:0 0 10px 10px;">
            <h2 style="font-size:18px;margin:0 0 12px;color:#1a1a18;">Great news, ${data.contact_name}!</h2>
            <p style="font-size:15px;color:#4a4a47;margin-bottom:16px;">Your property at <strong>${data.address}</strong> has been verified and is now live on NestX. Other homeowners can now find your listing and send you swap offers.</p>

            <div style="background:#E1F5EE;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
              <p style="margin:0;font-size:14px;color:#085041;font-weight:500;">💰 Remember — when you sell or swap, zero commission means every dollar of profit stays with you.</p>
            </div>

            <a href="https://nestx.co.nz/pages/dashboard.html" style="display:inline-block;background:#0F6E56;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              View your listing →
            </a>

            <p style="margin-top:20px;font-size:12px;color:#767672;">
              Questions? Contact us at hello@nestx.co.nz
            </p>
          </div>
        </div>
      `;
    } else if (type === 'open_to_chat') {
      // Email to the offerer — seller is open to chat
      subject = `💬 Great news — they're open to chat about your swap offer`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0F6E56;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">NestX</h1>
            <p style="color:#9FE1CB;margin:4px 0 0;font-size:14px;">Someone is open to chat!</p>
          </div>
          <div style="background:#f5f4f0;padding:24px;border-radius:0 0 10px 10px;">
            <h2 style="font-size:18px;margin:0 0 12px;color:#1a1a18;">Hi ${data.offerer_first_name}!</h2>
            <p style="font-size:15px;color:#4a4a47;margin-bottom:16px;">
              The owner of <strong>${data.listing_address}</strong> is open to chat about your swap offer for <strong>${data.offer_address}</strong>.
            </p>

            <div style="background:#E1F5EE;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
              <div style="font-size:13px;font-weight:600;color:#085041;margin-bottom:10px;">✅ Their contact details</div>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#767672;padding:4px 0;width:40%">First name</td><td style="font-weight:500;">${data.seller_first_name}</td></tr>
                <tr><td style="color:#767672;padding:4px 0;">Email</td><td style="font-weight:500;">${data.seller_email}</td></tr>
                ${data.seller_phone ? `<tr><td style="color:#767672;padding:4px 0;">Phone</td><td style="font-weight:500;">${data.seller_phone}</td></tr>` : ''}
              </table>
            </div>

            <p style="font-size:14px;color:#4a4a47;margin-bottom:16px;">Being open to chat is not a binding commitment — it simply means both parties are interested in exploring the swap further. We recommend getting independent valuations before proceeding.</p>

            <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e;">
              ⚖️ When you're ready to proceed, engage a licensed NZ conveyancer. Visit our <a href="https://nestx.co.nz/pages/conveyancers.html" style="color:#92400e;">conveyancer directory</a> for recommendations.
            </div>

            <p style="font-size:12px;color:#767672;">Questions? Contact us at <a href="mailto:hello@nestx.co.nz" style="color:#0F6E56;">hello@nestx.co.nz</a></p>
          </div>
        </div>
      `;
    } else if (type === 'listing_sold') {
      subject = `🎉 Congratulations on your sale — NestX`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0F6E56;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">NestX</h1>
            <p style="color:#9FE1CB;margin:4px 0 0;font-size:14px;">Congratulations on your sale!</p>
          </div>
          <div style="background:#f5f4f0;padding:24px;border-radius:0 0 10px 10px;">
            <h2 style="font-size:18px;margin:0 0 12px;color:#1a1a18;">Well done, ${data.contact_name}!</h2>
            <p style="font-size:15px;color:#4a4a47;margin-bottom:16px;">
              Your property at <strong>${data.address}</strong> has been marked as sold. Your listing has been removed and your subscription cancelled.
            </p>
            <div style="background:#E1F5EE;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
              <p style="margin:0;font-size:15px;color:#085041;font-weight:600;">
                💰 Zero commission means every dollar of your profit stays with you.
              </p>
            </div>
            <p style="font-size:14px;color:#4a4a47;">
              Thank you for using NestX. We hope it made your property journey easier.
              If you list another property in the future, we'd love to have you back.
            </p>
            <p style="margin-top:20px;font-size:12px;color:#767672;">
              Questions? Contact us at <a href="mailto:hello@nestx.co.nz" style="color:#0F6E56;">hello@nestx.co.nz</a>
            </p>
          </div>
        </div>
      `;
    } else if (type === 'listing_rejected') {
      subject = `Your NestX listing could not be verified — ${data.address}`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#1a1a18;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">NestX</h1>
          </div>
          <div style="background:#f5f4f0;padding:24px;border-radius:0 0 10px 10px;">
            <h2 style="font-size:18px;margin:0 0 12px;color:#1a1a18;">Hi ${data.contact_name},</h2>
            <p style="font-size:15px;color:#4a4a47;margin-bottom:16px;">Unfortunately we were unable to verify your listing at <strong>${data.address}</strong> at this time.</p>

            <div style="background:#fee2e2;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
              <p style="margin:0;font-size:14px;color:#991b1b;"><strong>Reason:</strong> ${data.reason}</p>
            </div>

            <p style="font-size:14px;color:#4a4a47;">Please contact us at <a href="mailto:hello@nestx.co.nz" style="color:#0F6E56;">hello@nestx.co.nz</a> if you have any questions or would like to resubmit.</p>
          </div>
        </div>
      `;
    }

    // Send to admin for new applications
    const toEmail = (type === 'new_listing' || type === 'new_conveyancer')
      ? ADMIN_EMAIL
      : data.contact_email || data.email;

    const { data: emailData, error } = await resend.emails.send({
      from: `NestX <${FROM_EMAIL}>`,
      to: toEmail,
      subject,
      html
    });

    if (error) throw error;

    return res.status(200).json({ success: true, id: emailData?.id });

  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
};
