import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Get environment variables with a fallback for local development.
    # Use a strong, random key for production.
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a-very-long-and-random-secret-key-that-should-be-in-production')
    # Get the database URL from the environment.
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # A crucial step for Render and other cloud platforms:
    # Explicitly add the SSL parameter to the connection string if it's not already there.
    if DATABASE_URL and 'sslmode' not in DATABASE_URL:
        if '?' in DATABASE_URL:
            SQLALCHEMY_DATABASE_URI = DATABASE_URL + '&sslmode=require'
        else:
            SQLALCHEMY_DATABASE_URI = DATABASE_URL + '?sslmode=require'
    else:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'a-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = 3600

    # Flask-Mail configuration
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 465
    MAIL_USE_SSL = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # OAuth configuration
    GOOGLE_OAUTH_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
    GOOGLE_OAUTH_REDIRECT_URI = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI")
