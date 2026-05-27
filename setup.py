"""
One-time setup script.
Run: python setup.py <mysql_root_password>
"""
import sys
import os
import subprocess
import re

def run(cmd, **kwargs):
    print(f"  > {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    if result.stdout: print(result.stdout.strip())
    if result.stderr: print(result.stderr.strip())
    return result.returncode == 0

def main():
    if len(sys.argv) < 2:
        print("Usage: python setup.py <mysql_root_password>")
        sys.exit(1)

    password = sys.argv[1]
    mysql = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

    print("\n[1/4] Testing MySQL connection...")
    ok = run([mysql, "-u", "root", f"-p{password}", "-e", "SELECT 1;"])
    if not ok:
        print("ERROR: Could not connect to MySQL. Check your password.")
        sys.exit(1)
    print("      Connected OK")

    print("\n[2/4] Creating database and running schema...")
    ok = run([mysql, "-u", "root", f"-p{password}", "-e",
              "CREATE DATABASE IF NOT EXISTS task_knowledge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"])
    if not ok:
        print("ERROR: Failed to create database.")
        sys.exit(1)

    schema_path = os.path.join(os.path.dirname(__file__), "database", "schema.sql")
    ok = run([mysql, "-u", "root", f"-p{password}", "task_knowledge_db", "-e",
              f"source {schema_path}"])
    # Fallback: pipe the file
    if not ok:
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        proc = subprocess.run(
            [mysql, "-u", "root", f"-p{password}", "task_knowledge_db"],
            input=schema_sql, capture_output=True, text=True
        )
        print(proc.stdout); print(proc.stderr)

    print("\n[3/4] Writing .env with your password...")
    env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
    with open(env_path, "r") as f:
        content = f.read()
    content = re.sub(r"DB_PASSWORD=.*", f"DB_PASSWORD={password}", content)
    with open(env_path, "w") as f:
        f.write(content)
    print("      .env updated")

    print("\n[4/4] Running Django migrations...")
    backend = os.path.join(os.path.dirname(__file__), "backend")
    run([sys.executable, "manage.py", "makemigrations"], cwd=backend)
    run([sys.executable, "manage.py", "migrate"], cwd=backend)
    run([sys.executable, "manage.py", "seed_roles"], cwd=backend)

    print("\n✓ Setup complete! Run the backend with:")
    print("    cd backend && python manage.py runserver")
    print("\nRun the frontend with:")
    print("    cd frontend && npm install && npm start")

if __name__ == "__main__":
    main()
