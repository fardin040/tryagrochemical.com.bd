CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, setting_key TEXT NOT NULL UNIQUE, setting_value TEXT);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, category TEXT, image TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, location TEXT, type TEXT DEFAULT 'Full Time', description TEXT, deadline TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS job_applications (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id INTEGER, applicant_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, cover_letter TEXT, resume TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, status TEXT NOT NULL DEFAULT 'pending', is_general INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS pages (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, content TEXT, meta_description TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS certifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, icon TEXT DEFAULT 'fa-certificate', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS dealers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, organization TEXT NOT NULL, address TEXT, district TEXT NOT NULL, phone TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sales_officers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, designation TEXT NOT NULL, area TEXT NOT NULL, phone TEXT, image TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES
 ('site_title','Try Agro Chemical Ltd'), ('phone','+8801715731845'), ('email','info@tryagrochemical.com.bd'), ('address','Dhaka, Bangladesh'), ('facebook','https://facebook.com/'), ('linkedin','https://linkedin.com/');
INSERT OR IGNORE INTO pages (slug,title,content,meta_description) VALUES
 ('home','Home','<h2>Welcome to Try Agro Chemical Ltd.</h2><p>Your trusted partner in sustainable agriculture.</p>','Try Agro Chemical agricultural solutions.'),
 ('about','About Us','<h2>About Try Agro Chemical Ltd.</h2><p>We are a leading agrochemical company committed to quality products, responsible use, and sustainable farming in Bangladesh.</p>','Learn about Try Agro Chemical Ltd.'),
 ('contact','Contact Us','<h2>Contact Us</h2><p>Get in touch with our team for product and agronomy support.</p>','Contact Try Agro Chemical Ltd.');
