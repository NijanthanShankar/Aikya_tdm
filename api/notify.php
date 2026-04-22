<?php
// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Notification Helper
//  Handles Email (SMTP) + WhatsApp (Twilio / UltraMsg)
//
//  HOW TO CONFIGURE:
//  1. Fill in your SMTP credentials below (or use Hostinger SMTP)
//  2. For WhatsApp, choose one provider and fill in credentials
//     Option A: Twilio  → TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
//     Option B: UltraMsg → ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN
//  3. Set MANAGER_WHATSAPP to manager's WhatsApp number (with country code, e.g. 919876543210)
// ─────────────────────────────────────────────────────────────

// ── SMTP Config (Gmail) ───────────────────────────────────────
// HOW TO SET UP GMAIL SMTP:
// 1. Go to https://myaccount.google.com/security
// 2. Enable "2-Step Verification"
// 3. Go to https://myaccount.google.com/apppasswords
// 4. Create an App Password (select "Mail" → "Other" → name it "Aikya Portal")
// 5. Copy the 16-character password and paste it below
// ─────────────────────────────────────────────────────────────
define('SMTP_HOST', 'smtp.gmail.com');         // Gmail SMTP
define('SMTP_PORT', 465);                       // SSL port
define('SMTP_USER', 'info2aikya299@gmail.com');                        // your-gmail@gmail.com
define('SMTP_PASS', 'niia atil psar djar');                        // 16-char App Password (NOT your Gmail password)
define('SMTP_FROM', 'info2aikya299@gmail.com');                        // same as SMTP_USER
define('SMTP_FROM_NAME', 'Aikya Portal');

// ── WhatsApp Config (choose ONE provider) ─────────────────────
// Option A: UltraMsg (recommended — easy, cheap)
define('ULTRAMSG_INSTANCE', '');                  // e.g. instance12345
define('ULTRAMSG_TOKEN', '');                  // API token from ultramsg.com

// Option B: Twilio
define('TWILIO_SID', '');
define('TWILIO_TOKEN', '');
define('TWILIO_FROM', 'whatsapp:+14155238886');  // Twilio sandbox number

// ── Active provider: 'ultramsg' | 'twilio' | 'none' ──────────
define('WHATSAPP_PROVIDER', 'ultramsg');

// ── Manager phone (WhatsApp) ──────────────────────────────────
// Add the manager's WhatsApp number with country code (no + sign)
define('MANAGER_WHATSAPP', '');                   // e.g. 919876543210

// ─────────────────────────────────────────────────────────────
//  Send WhatsApp message
// ─────────────────────────────────────────────────────────────
function sendWhatsApp(string $to, string $message): bool
{
    if (!$to || WHATSAPP_PROVIDER === 'none')
        return false;
    // Ensure number has no + prefix
    $to = ltrim($to, '+');

    if (WHATSAPP_PROVIDER === 'ultramsg') {
        if (!ULTRAMSG_INSTANCE || !ULTRAMSG_TOKEN)
            return false;
        $url = "https://api.ultramsg.com/" . ULTRAMSG_INSTANCE . "/messages/chat";
        $data = http_build_query([
            'token' => ULTRAMSG_TOKEN,
            'to' => $to,
            'body' => $message,
        ]);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_TIMEOUT => 10,
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        $json = json_decode($res, true);
        return isset($json['sent']) && $json['sent'] === 'true';
    }

    if (WHATSAPP_PROVIDER === 'twilio') {
        if (!TWILIO_SID || !TWILIO_TOKEN)
            return false;
        $url = "https://api.twilio.com/2010-04-01/Accounts/" . TWILIO_SID . "/Messages.json";
        $data = http_build_query([
            'From' => TWILIO_FROM,
            'To' => "whatsapp:+$to",
            'Body' => $message,
        ]);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_USERPWD => TWILIO_SID . ':' . TWILIO_TOKEN,
            CURLOPT_TIMEOUT => 10,
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        $json = json_decode($res, true);
        return isset($json['sid']);
    }

    return false;
}

// ─────────────────────────────────────────────────────────────
//  Send Email via SMTP (Gmail-compatible, direct socket)
// ─────────────────────────────────────────────────────────────
function smtpRead($socket): string
{
    $response = '';
    while (true) {
        $line = fgets($socket, 512);
        if ($line === false)
            break;
        $response .= $line;
        // SMTP multi-line: 4th char is '-' for continuation, ' ' for last line
        if (isset($line[3]) && $line[3] === ' ')
            break;
    }
    return $response;
}

function smtpSend($socket, string $cmd): string
{
    fwrite($socket, $cmd);
    return smtpRead($socket);
}

function sendEmail(string $toEmail, string $toName, string $subject, string $htmlBody): bool
{
    if (!SMTP_USER || !SMTP_PASS || !$toEmail)
        return false;
    try {
        $socket = fsockopen('ssl://' . SMTP_HOST, SMTP_PORT, $errno, $errstr, 5);
        if (!$socket)
            return false;
        stream_set_timeout($socket, 5);

        // Read greeting
        smtpRead($socket);

        // EHLO — Gmail sends multi-line response, must read ALL lines
        $ehlo = smtpSend($socket, "EHLO " . gethostname() . "\r\n");
        if (strpos($ehlo, '250') === false) {
            fclose($socket);
            return false;
        }

        // AUTH LOGIN
        $auth = smtpSend($socket, "AUTH LOGIN\r\n");
        if (strpos($auth, '334') === false) {
            fclose($socket);
            return false;
        }

        // Username
        $userRes = smtpSend($socket, base64_encode(SMTP_USER) . "\r\n");
        if (strpos($userRes, '334') === false) {
            fclose($socket);
            return false;
        }

        // Password
        $passRes = smtpSend($socket, base64_encode(SMTP_PASS) . "\r\n");
        if (strpos($passRes, '235') === false) {
            fclose($socket);
            return false;
        }

        // MAIL FROM
        $from = smtpSend($socket, "MAIL FROM:<" . SMTP_FROM . ">\r\n");
        if (strpos($from, '250') === false) {
            fclose($socket);
            return false;
        }

        // RCPT TO
        $rcpt = smtpSend($socket, "RCPT TO:<$toEmail>\r\n");
        if (strpos($rcpt, '250') === false) {
            fclose($socket);
            return false;
        }

        // DATA
        $data = smtpSend($socket, "DATA\r\n");
        if (strpos($data, '354') === false) {
            fclose($socket);
            return false;
        }

        // Build email
        $headers = implode("\r\n", [
            "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM . ">",
            "To: $toName <$toEmail>",
            "Subject: $subject",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "Date: " . date('r'),
            "Message-ID: <" . uniqid('aikya_') . "@" . gethostname() . ">",
        ]);
        $msg = smtpSend($socket, "$headers\r\n\r\n$htmlBody\r\n.\r\n");
        if (strpos($msg, '250') === false) {
            fclose($socket);
            return false;
        }

        // QUIT
        smtpSend($socket, "QUIT\r\n");
        fclose($socket);
        return true;
    } catch (\Throwable $e) {
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
//  Notification Templates
// ─────────────────────────────────────────────────────────────

/** Notify manager when a member checks in */
function notifyCheckin(array $member, string $time, string $location): void
{
    $msg = "✅ *Aikya Task Portal*\n\n"
        . "📍 *Check-In Alert*\n"
        . "*{$member['name']}* has checked in.\n"
        . "🕐 Time: $time\n"
        . "📌 Location: $location";

    if (MANAGER_WHATSAPP)
        sendWhatsApp(MANAGER_WHATSAPP, $msg);

    // Email to manager
    $db = getDB();
    $managers = $db->query("SELECT name, email FROM users WHERE role = 'admin'")->fetchAll();
    foreach ($managers as $mgr) {
        if (!$mgr['email'])
            continue;
        $html = emailTemplate("Check-In Alert", "
            <p><strong>{$member['name']}</strong> has checked in.</p>
            <table>
                <tr><td>⏰ Time</td><td>$time</td></tr>
                <tr><td>📌 Location</td><td>$location</td></tr>
            </table>
        ");
        sendEmail($mgr['email'], $mgr['name'], "✅ {$member['name']} Checked In — Aikya Portal", $html);
    }
}

/** Notify member when a task is assigned to them */
function notifyTaskAssigned(array $task, array $member): void
{
    $msg = "📋 *Aikya Task Portal*\n\n"
        . "📌 *New Task Assigned to You*\n"
        . "Task: *{$task['title']}*\n"
        . "Priority: {$task['priority']}\n"
        . ($task['due_date'] ? "Due: {$task['due_date']}\n" : '')
        . "\nLog in to view details.";

    if ($member['phone'])
        sendWhatsApp($member['phone'], $msg);

    $html = emailTemplate("New Task Assigned", "
        <p>A new task has been assigned to you.</p>
        <table>
            <tr><td>📌 Task</td><td><strong>{$task['title']}</strong></td></tr>
            <tr><td>⚡ Priority</td><td>{$task['priority']}</td></tr>
            " . ($task['due_date'] ? "<tr><td>📅 Due</td><td>{$task['due_date']}</td></tr>" : '') . "
            <tr><td>📝 Description</td><td>" . ($task['description'] ?: '—') . "</td></tr>
        </table>
    ");
    sendEmail($member['email'], $member['name'], "📋 New Task: {$task['title']} — Aikya Portal", $html);
}

/** Notify manager when member adds a note */
function notifyNoteAdded(array $task, array $member, string $noteText): void
{
    $short = mb_strlen($noteText) > 120 ? mb_substr($noteText, 0, 120) . '…' : $noteText;
    $msg = "💬 *Aikya Task Portal*\n\n"
        . "📝 *New Note Added*\n"
        . "Task: *{$task['title']}*\n"
        . "By: {$member['name']}\n"
        . "Note: $short";

    if (MANAGER_WHATSAPP)
        sendWhatsApp(MANAGER_WHATSAPP, $msg);

    $db = getDB();
    $managers = $db->query("SELECT name, email FROM users WHERE role = 'admin'")->fetchAll();
    foreach ($managers as $mgr) {
        if (!$mgr['email'])
            continue;
        $html = emailTemplate("Note Added to Task", "
            <p><strong>{$member['name']}</strong> added a note to <strong>{$task['title']}</strong>.</p>
            <blockquote style='border-left:3px solid #7c3aed;padding:8px 16px;color:#555;margin:16px 0;'>$noteText</blockquote>
        ");
        sendEmail($mgr['email'], $mgr['name'], "💬 New Note on: {$task['title']} — Aikya Portal", $html);
    }
}

/** Notify manager when member updates task status */
function notifyStatusChanged(array $task, array $member, string $oldStatus, string $newStatus): void
{
    $labels = [
        'new' => 'New',
        'pending' => 'Pending',
        'in_progress' => 'In Progress',
        'completed' => 'Completed',
        'need_clarification' => 'Need Clarification',
        'pending_requirements' => 'Pending Requirements',
        'paused' => 'Paused',
    ];
    $oldLabel = $labels[$oldStatus] ?? $oldStatus;
    $newLabel = $labels[$newStatus] ?? $newStatus;

    $msg = "🔄 *Aikya Task Portal*\n\n"
        . "📊 *Task Status Changed*\n"
        . "Task: *{$task['title']}*\n"
        . "By: {$member['name']}\n"
        . "$oldLabel → *$newLabel*";

    if (MANAGER_WHATSAPP)
        sendWhatsApp(MANAGER_WHATSAPP, $msg);

    $db = getDB();
    $managers = $db->query("SELECT name, email FROM users WHERE role = 'admin'")->fetchAll();
    foreach ($managers as $mgr) {
        if (!$mgr['email'])
            continue;
        $html = emailTemplate("Task Status Updated", "
            <p><strong>{$member['name']}</strong> updated the status of <strong>{$task['title']}</strong>.</p>
            <table>
                <tr><td>Previous</td><td>$oldLabel</td></tr>
                <tr><td>New Status</td><td><strong>$newLabel</strong></td></tr>
            </table>
        ");
        sendEmail($mgr['email'], $mgr['name'], "🔄 Status Update: {$task['title']} — Aikya Portal", $html);
    }
}

// ─────────────────────────────────────────────────────────────
//  Email HTML Template
// ─────────────────────────────────────────────────────────────
function emailTemplate(string $heading, string $content): string
{
    return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body{font-family:'Segoe UI',sans-serif;background:#f0eeff;margin:0;padding:20px}
  .wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,.1)}
  .head{background:linear-gradient(135deg,#7c3aed,#a78bfa);padding:28px 32px;color:#fff}
  .head h1{margin:0;font-size:20px;font-weight:800}
  .head p{margin:4px 0 0;opacity:.8;font-size:13px}
  .body{padding:28px 32px;color:#333;font-size:15px;line-height:1.6}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  td{padding:10px 12px;border-bottom:1px solid #f0eeff;vertical-align:top}
  td:first-child{font-weight:600;color:#7c3aed;width:40%}
  .foot{background:#f9f7ff;padding:16px 32px;font-size:12px;color:#9ca3af;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><h1>$heading</h1><p>Aikya Task Portal</p></div>
  <div class="body">$content</div>
  <div class="foot">You're receiving this because you're part of the Aikya team. Do not reply to this email.</div>
</div>
</body>
</html>
HTML;
}
