#!/usr/bin/env python3
import json
import jwt
import os
import argparse
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Configuration from environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-for-development")
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")  # Base URL for login link
BREVO_API_KEY = os.getenv("BREVO_API", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@hackit.tw")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "HackScore Team")

def generate_token(user):
    """
    Generate JWT token for a user
    """
    payload = {
        "email": user["email"],
        "user_id": user["_id"],
        "team_id": user["team_id"],
        "is_admin": False,
        "is_judge": True,
        "exp": datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    
    # Generate token
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def load_email_template():
    """
    Load the email template from file
    """
    template_path = Path("template/rating_email_invite.html")
    if not template_path.exists():
        print(f"Warning: Template file not found at {template_path}")
        return None
    
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()

def send_email_with_brevo(user, token, template):
    """
    Send email with login link using Brevo API
    """
    if not BREVO_API_KEY:
        print("Brevo API key not found in environment variables")
        return False
    
    login_url = f"{BASE_URL}/login?auth={token}"
    
    # Replace placeholders in template
    if template:
        html_content = template.replace("{{ memberName }}", f"{user['name_zh']} ({user['name_en']})")
    else:
        # Fallback basic HTML if template not found
        html_content = f"""
        <html>
        <body>
            <h2>歡迎使用HackScore!</h2>
            <p>您好，{user['name_zh']} ({user['name_en']}),</p>
            <p>我們誠摯地邀請您擔任本次黑客松的評委。</p>
            <p>請使用以下鏈接登錄：</p>
            <p><a href="{login_url}">{login_url}</a></p>
            <p>此鏈接將在7天後過期。</p>
            <p>感謝您的參與！</p>
        </body>
        </html>
        """

    # Add login URL button to template
    html_content = html_content.replace("<!-- Login button will be inserted here by the script -->", f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{login_url}" style="background-color: #2ecc71; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">點擊此處登錄HackScore系統</a>
        </div>
    """)
    
    # Prepare the API request
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": EMAIL_FROM_NAME,
            "email": EMAIL_FROM
        },
        "to": [
            {
                "email": user["email"],
                "name": f"{user['name_zh']} ({user['name_en']})"
            }
        ],
        "subject": "HackScore: 您的登錄鏈接",
        "htmlContent": html_content
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 201:
            print(f"Email sent successfully to {user['email']}")
            return True
        else:
            print(f"Failed to send email to {user['email']}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Exception sending email to {user['email']}: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Generate JWT tokens and send emails')
    parser.add_argument('--data', type=str, default='data.json', help='Path to data.json file')
    parser.add_argument('--dry-run', action='store_true', help='Generate tokens but do not send emails')
    parser.add_argument('--output', type=str, help='Output tokens to a file instead of sending emails')
    parser.add_argument('--to', type=str, help='Send to specific email address only')
    args = parser.parse_args()
    
    # Load data
    try:
        with open(args.data, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading data file: {str(e)}")
        return
    
    # Load email template
    email_template = load_email_template()
    if not email_template and not args.dry_run and not args.output:
        print("Warning: Email template not found. Will use fallback template.")
    
    # Validate Brevo API configuration
    if not args.dry_run and not args.output:
        if not BREVO_API_KEY:
            print("Brevo API key not found. Please set BREVO_API environment variable.")
            return
    
    # Output tokens list
    tokens = []
    
    # Process all teams and members
    for team in data:
        print(f"Processing team: {team['team_name']}")
        
        for member in team['members']:
            # Skip if not the specified email (when --to is used)
            if args.to and args.to != member['email']:
                continue
                
            # Generate token
            token = generate_token(member)
            login_url = f"{BASE_URL}/login?auth={token}"
            
            tokens.append({
                "name": member['name_zh'],
                "email": member['email'],
                "token": token,
                "login_url": login_url
            })
            
            print(f"  Generated token for {member['name_zh']} ({member['email']})")
            
            # Send email if not in dry-run mode and not outputting to file
            if not args.dry_run and not args.output:
                send_email_with_brevo(member, token, email_template)
    
    # Output tokens to file if specified
    if args.output:
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(tokens, f, ensure_ascii=False, indent=2)
            print(f"Tokens saved to {args.output}")
        except Exception as e:
            print(f"Error saving tokens to file: {str(e)}")
    
    if tokens:
        print(f"Processed {len(tokens)} users from {len(data)} teams")
    else:
        print("No tokens generated. Check your filters or data file.")

if __name__ == "__main__":
    main() 