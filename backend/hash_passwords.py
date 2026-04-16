from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)

passwords = {
    "manager": "manager123",
    "engineer": "engineer123",
    "client_test": "client123",
}

for username, password in passwords.items():
    hashed = pwd_context.hash(password)
    print(f"{username}: {hashed}")