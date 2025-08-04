import os
import pathlib
import sys
import requests
from flask import Flask, session, abort, redirect, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from flask_mail import Mail, Message
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pip._vendor import cachecontrol
import google.auth.transport.requests
from Config import Config
from models import db, User, Todo
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError

# The following line is crucial for local development, as it allows HTTP traffic.
# It is ignored on production servers with HTTPS.
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Create the Flask application instance
app = Flask(__name__)

# Load configuration from the Config object
app.config.from_object(Config)
CORS(app, supports_credentials=True)

# Set a secret key for session management, required for OAuth.
# Use an environment variable, with a fallback for local dev.
app.secret_key = os.environ.get("SECRET_KEY", os.urandom(24))

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
mail = Mail(app)

# --- Google OAuth Configuration based on your code ---
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
backend_url = os.environ.get("BACKEND_URL", "http://127.0.0.1:5000")
frontend_url = os.environ.get("FRONTEND_URL", "http://127.0.0.1:5173")

# Check if required environment variables are set
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("Error: GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET environment variables must be set.", file=sys.stderr)
    sys.exit(1)

# Set up the OAuth flow with environment variables
flow = Flow.from_client_config(
    client_config={
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        }
    },
    scopes=["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email", "openid"],
    redirect_uri=f"{backend_url}/callback" # This must match the URI in the Google Cloud Console
)

# Create the database tables if they don't exist
with app.app_context():
    db.create_all()

# --- User authentication routes ---

@app.route("/")
def index():
    """A simple root route that returns a static message."""
    return jsonify({"message": "Welcome to the backend API!"})

@app.route("/register", methods=["POST"])
def register():
    """Handle user registration with email and password."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    userName = data.get("userName")

    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400
    
    hashed_password = generate_password_hash(password)
    new_user = User(
        email=email,
        password_hash=hashed_password,
        userName=userName
    )
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"msg": "User registered successfully"}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Email already exists"}), 409
    except Exception as e:
        db.session.rollback()
        print(f"Error during user registration: {e}", file=sys.stderr)
        return jsonify({"msg": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    """Handle user login with email and password."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Invalid email or password"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token}), 200

@app.route("/login/google")
def google_login():
    """
    Initializes the Google OAuth flow.
    This is the route the frontend's "Sign in with Google" button should point to.
    """
    authorization_url, state = flow.authorization_url()
    session["state"] = state
    return redirect(authorization_url)

@app.route("/callback")
def callback():
    """
    Handles the callback from Google after the user signs in.
    It verifies the token and creates a JWT for the user.
    """
    # Check for state mismatch
    if not session.get("state") == request.args.get("state"):
        print(f"State mismatch error. Session state: {session.get('state')}, Request state: {request.args.get('state')}", file=sys.stderr)
        return jsonify({"msg": "State mismatch. Please try again."}), 400
    
    # Try to fetch the token
    try:
        flow.fetch_token(authorization_response=request.url)
    except Exception as e:
        print(f"Error fetching token from Google: {e}", file=sys.stderr)
        return jsonify({"msg": f"Failed to fetch token from Google: {e}"}), 500

    credentials = flow.credentials
    
    request_session = requests.session()
    cached_session = cachecontrol.CacheControl(request_session)
    token_request = google.auth.transport.requests.Request(session=cached_session)

    # Try to verify the ID token
    try:
        id_info = id_token.verify_oauth2_token(
            id_token=credentials._id_token,
            request=token_request,
            audience=GOOGLE_CLIENT_ID
        )
    except Exception as e:
        print(f"Error verifying ID token: {e}", file=sys.stderr)
        return jsonify({"msg": f"Failed to verify Google ID token: {e}"}), 500

    email = id_info.get("email")
    user_name = id_info.get("name")

    # Check for existing user or create a new one
    user = User.query.filter_by(email=email).first()
    if not user:
        try:
            user = User(email=email, userName=user_name, password_hash=None)
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            user = User.query.filter_by(email=email).first()
        except Exception as e:
            db.session.rollback()
            print(f"Error creating new user: {e}", file=sys.stderr)
            return jsonify({"msg": "Failed to create new user"}), 500
    
    # Create and return JWT
    access_token = create_access_token(identity=str(user.id))
    
    return redirect(f"{frontend_url}/Home?access_token={access_token}")

@app.route("/logout")
def logout():
    """Clears the session."""
    session.clear()
    return redirect("/")

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """A protected route that requires a valid JWT token."""
    current_user_id = get_jwt_identity()
    return jsonify(logged_in_as=current_user_id), 200

# --- To do routes ---

@app.route("/todos", methods=["POST"])
@jwt_required()
def create_todo():
    """Create a new to-do item for the current user."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    title = data.get("title")

    if not title:
        return jsonify({"msg": "Title is required"}), 400
    
    new_todo = Todo(title=title, user_id=current_user_id)
    db.session.add(new_todo)
    db.session.commit()
    
    user = User.query.get(current_user_id)
    if user and user.email:
        msg = Message("New To-Do Created", sender=app.config['MAIL_USERNAME'], recipients=[user.email])
        msg.body = f"Hello {user.email},\n\nA new to-do item with the title '{title}' has been created in your account."
        mail.send(msg)
    
    return jsonify({"msg": "To-do created successfully", "todo": new_todo.serialize()}), 201

@app.route("/todos", methods=["GET"])
@jwt_required()
def get_todos():
    """Retrieve all to-do items for the current user."""
    current_user_id = get_jwt_identity()
    todos = Todo.query.filter_by(user_id=current_user_id).all()
    return jsonify({"todos": [todo.serialize() for todo in todos]}), 200

@app.route('/todos/<int:todo_id>', methods=['PUT'])
@jwt_required()
def update_todo(todo_id):
    """Update an existing to-do item."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    todo = Todo.query.filter_by(id=todo_id, user_id=current_user_id).first()

    if not todo:
        return jsonify({"msg": "To-do not found"}), 404

    todo.title = data.get('title', todo.title)
    todo.completed = data.get('completed', todo.completed)
    db.session.commit()
    
    return jsonify({"msg": "To-do updated successfully", "todo": todo.serialize()}), 200

@app.route('/todos/<int:todo_id>', methods=['DELETE'])
@jwt_required()
def delete_todo(todo_id):
    """Delete a to-do item."""
    current_user_id = get_jwt_identity()
    todo = Todo.query.filter_by(id=todo_id, user_id=current_user_id).first()

    if not todo:
        return jsonify({"msg": "To-do not found"}), 404

    db.session.delete(todo)
    db.session.commit()
    
    return jsonify({"msg": "To-do deleted successfully"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
