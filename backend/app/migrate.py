"""
Schema migration script for the Warranty Claim Platform.

Upgrades an existing Review-1 database (users/products/warranty_claims)
to the full schema without losing existing data.

Run from backend/:
    python -m app.migrate
"""

from sqlalchemy import text

from app.database import engine


def column_exists(db, table, column):
    row = db.execute(
        text(
            f"SELECT COUNT(*) FROM information_schema.COLUMNS "
            f"WHERE TABLE_SCHEMA = DATABASE() "
            f"AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}'"
        )
    ).scalar()
    return bool(row)


def add_column(db, table, definition):
    if not column_exists(db, table, definition.split()[0]):
        db.execute(text(f"ALTER TABLE {table} ADD COLUMN {definition}"))
        print(f"  + {table}.{definition.split()[0]}")


def add_table(db, create_sql):
    db.execute(text(create_sql))
    print("  + table created")


def table_exists(db, table):
    row = db.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.TABLES "
            f"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}'"
        )
    ).scalar()
    return bool(row)


def run():
    with engine.begin() as db:
        print("Migrating database...")

        # users
        add_column(db, "users", "phone VARCHAR(20) NULL")
        add_column(db, "users", "address VARCHAR(255) NULL")
        add_column(db, "users", "created_at DATETIME NULL")

        # products
        add_column(db, "products", "category VARCHAR(100) NULL")
        add_column(db, "products", "created_at DATETIME NULL")

        # products.purchase_date was VARCHAR(50) in the old schema; convert to DATE
        col = db.execute(
            text(
                "SELECT DATA_TYPE FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' "
                "AND COLUMN_NAME='purchase_date'"
            )
        ).scalar()
        if col == "varchar":
            db.execute(
                text("ALTER TABLE products MODIFY purchase_date DATE NULL")
            )
            print("  + products.purchase_date converted to DATE")

        # warranty_claims
        add_column(db, "warranty_claims", "claim_number VARCHAR(30) NULL")
        add_column(db, "warranty_claims", "description TEXT NULL")
        add_column(db, "warranty_claims", "service_center_id INT NULL")
        add_column(db, "warranty_claims", "repair_status VARCHAR(30) NULL DEFAULT 'not_started'")
        add_column(db, "warranty_claims", "admin_note TEXT NULL")
        add_column(db, "warranty_claims", "assigned_at DATETIME NULL")
        add_column(db, "warranty_claims", "completed_at DATETIME NULL")
        add_column(db, "warranty_claims", "created_at DATETIME NULL")
        add_column(db, "warranty_claims", "updated_at DATETIME NULL")

        # service_centers table (must exist before FK is added below)
        if not table_exists(db, "service_centers"):
            add_table(
                db,
                """
                CREATE TABLE service_centers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    address VARCHAR(255) NULL,
                    city VARCHAR(100) NULL,
                    phone VARCHAR(20) NULL,
                    email VARCHAR(100) NULL,
                    rating FLOAT DEFAULT 0.0,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at DATETIME NULL,
                    INDEX ix_service_centers_name (name)
                )
                """,
            )

        # Add unique index on claim_number
        idx = db.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='warranty_claims' "
                "AND INDEX_NAME='ix_warranty_claims_claim_number'"
            )
        ).scalar()
        if not idx:
            db.execute(
                text(
                    "ALTER TABLE warranty_claims "
                    "ADD UNIQUE INDEX ix_warranty_claims_claim_number (claim_number)"
                )
            )
            print("  + unique index on warranty_claims.claim_number")

        # FK for service_center_id
        fk = db.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS "
                "WHERE CONSTRAINT_SCHEMA=DATABASE() "
                "AND CONSTRAINT_NAME='fk_warranty_claims_service_center'"
            )
        ).scalar()
        if not fk:
            db.execute(
                text(
                    "ALTER TABLE warranty_claims "
                    "ADD CONSTRAINT fk_warranty_claims_service_center "
                    "FOREIGN KEY (service_center_id) REFERENCES service_centers(id)"
                )
            )
            print("  + FK warranty_claims.service_center_id")

        # invoices table
        if not table_exists(db, "invoices"):
            add_table(
                db,
                """
                CREATE TABLE invoices (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_path VARCHAR(255) NOT NULL,
                    file_size INT DEFAULT 0,
                    content_type VARCHAR(100) NULL,
                    extracted_text TEXT NULL,
                    verified TINYINT(1) DEFAULT 0,
                    upload_date DATETIME NULL,
                    INDEX ix_invoices_product_id (product_id),
                    CONSTRAINT fk_invoices_product FOREIGN KEY (product_id)
                        REFERENCES products(id)
                )
                """,
            )

        # notifications table
        if not table_exists(db, "notifications"):
            add_table(
                db,
                """
                CREATE TABLE notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(150) NOT NULL,
                    message TEXT NOT NULL,
                    channel VARCHAR(20) DEFAULT 'app',
                    is_read TINYINT(1) DEFAULT 0,
                    created_at DATETIME NULL,
                    INDEX ix_notifications_user_id (user_id),
                    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
                        REFERENCES users(id)
                )
                """,
            )

        # Backfill claim numbers for existing claims
        db.execute(
            text(
                "SET @n = 0"
            )
        )
        db.execute(
            text(
                "UPDATE warranty_claims "
                "SET claim_number = CONCAT('WC-', YEAR(NOW()), '-', "
                "LPAD(@n := @n + 1, 6, '0')) "
                "WHERE claim_number IS NULL ORDER BY id"
            )
        )
        print("  + backfilled claim numbers")

        # Default repair_status
        db.execute(
            text(
                "UPDATE warranty_claims SET repair_status = 'not_started' "
                "WHERE repair_status IS NULL"
            )
        )

    print("Migration complete.")


if __name__ == "__main__":
    run()
