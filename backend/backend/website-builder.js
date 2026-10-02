const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const { LyraSearchEngine } = require('./lyra-search');
const SocialMediaAnalytics = require('./social-analytics');
require('dotenv').config();

class WebsiteBuilder {
  constructor() {
    this.searchEngine = new LyraSearchEngine();
    this.analytics = new SocialMediaAnalytics();
    this.templates = new Map();
    this.projects = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🌐 Initializing LyraLytics Website Builder...');
      await this.searchEngine.initialize();
      this.loadTemplates();
      this.createProjectDirectories();
      console.log('✅ Website Builder initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Website Builder:', error);
    }
  }

  loadTemplates() {
    // Business Website Template
    this.templates.set('business', {
      name: 'Professional Business Website',
      description: 'Modern business website with analytics integration',
      features: ['responsive', 'seo', 'analytics', 'contact-form', 'blog'],
      structure: {
        pages: ['home', 'about', 'services', 'portfolio', 'contact', 'blog'],
        components: ['header', 'footer', 'navigation', 'hero', 'cta', 'testimonials']
      }
    });

    // E-commerce Template
    this.templates.set('ecommerce', {
      name: 'E-commerce Website',
      description: 'Full-featured online store with payment integration',
      features: ['responsive', 'seo', 'analytics', 'payment', 'inventory', 'checkout'],
      structure: {
        pages: ['home', 'products', 'product-detail', 'cart', 'checkout', 'account'],
        components: ['header', 'footer', 'navigation', 'product-grid', 'cart-widget', 'search']
      }
    });

    // Portfolio Template
    this.templates.set('portfolio', {
      name: 'Creative Portfolio Website',
      description: 'Showcase your work with stunning visuals',
      features: ['responsive', 'seo', 'analytics', 'gallery', 'contact-form'],
      structure: {
        pages: ['home', 'about', 'portfolio', 'services', 'contact'],
        components: ['header', 'footer', 'navigation', 'gallery', 'testimonials', 'contact-form']
      }
    });
  }

  createProjectDirectories() {
    const dirs = ['projects', 'templates', 'assets', 'builds'];
    dirs.forEach(dir => {
      fs.ensureDirSync(path.join(process.cwd(), dir));
    });
  }

  async createProject(config) {
    const projectId = `project_${Date.now()}`;
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    
    await fs.ensureDir(projectPath);
    
    const project = {
      id: projectId,
      name: config.name,
      template: config.template,
      domain: config.domain,
      features: config.features || [],
      analytics: config.analytics || {},
      createdAt: new Date(),
      status: 'created'
    };

    this.projects.set(projectId, project);
    
    // Generate project structure
    await this.generateProjectStructure(project, projectPath);
    
    return projectId;
  }

  async generateProjectStructure(project, projectPath) {
    const template = this.templates.get(project.template);
    if (!template) {
      throw new Error(`Template ${project.template} not found`);
    }

    // Create basic directory structure
    const dirs = ['src', 'public', 'assets', 'styles', 'scripts', 'components'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    // Generate HTML pages
    for (const page of template.structure.pages) {
      await this.generatePage(project, projectPath, page);
    }

    // Generate components
    for (const component of template.structure.components) {
      await this.generateComponent(project, projectPath, component);
    }

    // Generate configuration files
    await this.generateConfigFiles(project, projectPath);

    // Generate analytics integration
    if (project.features.includes('analytics')) {
      await this.generateAnalyticsIntegration(project, projectPath);
    }

    project.status = 'generated';
  }

  async generatePage(project, projectPath, pageName) {
    const template = this.templates.get(project.template);
    const pageTemplate = this.getPageTemplate(pageName, template);
    
    const html = ejs.render(pageTemplate, {
      project,
      page: pageName,
      title: this.getPageTitle(pageName, project.name),
      analytics: project.analytics
    });

    await fs.writeFile(
      path.join(projectPath, 'src', `${pageName}.html`),
      html
    );
  }

  getPageTemplate(pageName, template) {
    const baseTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <meta name="description" content="<%= project.name %> - Professional website">
    <link rel="stylesheet" href="../styles/main.css">
    <% if (analytics.googleAnalytics) { %>
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=<%= analytics.googleAnalytics %>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<%= analytics.googleAnalytics %>');
    </script>
    <% } %>
</head>
<body>
    <%- include('../components/header.html') %>
    
    <main class="page-<%= page %>">
        <%- include('../components/<%= page %>.html') %>
    </main>
    
    <%- include('../components/footer.html') %>
    
    <script src="../scripts/main.js"></script>
    <% if (analytics.lyralytics) { %>
    <script src="../scripts/lyralytics.js"></script>
    <% } %>
</body>
</html>`;

    return baseTemplate;
  }

  getPageTitle(pageName, projectName) {
    const titles = {
      home: `${projectName} - Home`,
      about: `About ${projectName}`,
      services: `Services - ${projectName}`,
      portfolio: `Portfolio - ${projectName}`,
      contact: `Contact ${projectName}`,
      blog: `Blog - ${projectName}`,
      products: `Products - ${projectName}`,
      'product-detail': `Product - ${projectName}`,
      cart: `Shopping Cart - ${projectName}`,
      checkout: `Checkout - ${projectName}`,
      account: `My Account - ${projectName}`
    };
    
    return titles[pageName] || `${projectName}`;
  }

  async generateComponent(project, projectPath, componentName) {
    const componentTemplate = this.getComponentTemplate(componentName, project);
    
    await fs.writeFile(
      path.join(projectPath, 'components', `${componentName}.html`),
      componentTemplate
    );
  }

  getComponentTemplate(componentName, project) {
    const templates = {
      header: `
<header class="site-header">
    <div class="container">
        <div class="logo">
            <a href="index.html">
                <h1><%= project.name %></h1>
            </a>
        </div>
        <nav class="main-nav">
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="services.html">Services</a></li>
                <li><a href="portfolio.html">Portfolio</a></li>
                <li><a href="contact.html">Contact</a></li>
            </ul>
        </nav>
    </div>
</header>`,

      footer: `
<footer class="site-footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h3><%= project.name %></h3>
                <p>Professional solutions for your business needs.</p>
            </div>
            <div class="footer-section">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="about.html">About</a></li>
                    <li><a href="services.html">Services</a></li>
                    <li><a href="contact.html">Contact</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Contact Info</h4>
                <p>Email: info@<%= project.domain %></p>
                <p>Phone: (555) 123-4567</p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 <%= project.name %>. All rights reserved.</p>
        </div>
    </div>
</footer>`,

      hero: `
<section class="hero">
    <div class="container">
        <div class="hero-content">
            <h1>Welcome to <%= project.name %></h1>
            <p>Professional solutions tailored to your business needs.</p>
            <div class="hero-buttons">
                <a href="services.html" class="btn btn-primary">Our Services</a>
                <a href="contact.html" class="btn btn-secondary">Get Started</a>
            </div>
        </div>
    </div>
</section>`,

      cta: `
<section class="cta">
    <div class="container">
        <div class="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Contact us today to discuss your project requirements.</p>
            <a href="contact.html" class="btn btn-primary">Contact Us</a>
        </div>
    </div>
</section>`,

      'contact-form': `
<section class="contact-form">
    <div class="container">
        <h2>Get In Touch</h2>
        <form id="contactForm" class="form">
            <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Send Message</button>
        </form>
    </div>
</section>`
    };

    return templates[componentName] || `<div class="${componentName}">${componentName} component</div>`;
  }

  async generateConfigFiles(project, projectPath) {
    // Package.json
    const packageJson = {
      name: project.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `Website for ${project.name}`,
      scripts: {
        start: 'node server.js',
        build: 'npm run build:css && npm run build:js',
        'build:css': 'postcss styles/main.css -o public/styles/main.css',
        'build:js': 'webpack --mode production',
        dev: 'nodemon server.js'
      },
      dependencies: {
        express: '^4.18.2',
        ejs: '^3.1.9'
      },
      devDependencies: {
        nodemon: '^3.0.1',
        postcss: '^8.4.32',
        autoprefixer: '^10.4.16',
        tailwindcss: '^3.3.6'
      }
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Server.js
    const serverTemplate = `
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.render('home', { 
        project: ${JSON.stringify(project)},
        analytics: ${JSON.stringify(project.analytics)}
    });
});

app.get('/:page', (req, res) => {
    const page = req.params.page;
    res.render(page, { 
        project: ${JSON.stringify(project)},
        analytics: ${JSON.stringify(project.analytics)}
    });
});

app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});`;

    await fs.writeFile(
      path.join(projectPath, 'server.js'),
      serverTemplate
    );

    // CSS
    const cssTemplate = `
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.site-header {
    background: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.site-header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 20px;
}

.logo h1 {
    color: #007bff;
    font-size: 1.5rem;
}

.main-nav ul {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.main-nav a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s;
}

.main-nav a:hover {
    color: #007bff;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4rem 0;
    text-align: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 5px;
    font-weight: 500;
    transition: all 0.3s;
    border: none;
    cursor: pointer;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #007bff;
}

/* Footer */
.site-footer {
    background: #333;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
}

.footer-section ul {
    list-style: none;
}

.footer-section a {
    color: #ccc;
    text-decoration: none;
}

.footer-section a:hover {
    color: white;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #555;
}

/* Forms */
.form {
    max-width: 600px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.form-group textarea {
    resize: vertical;
}

/* Responsive */
@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .main-nav ul {
        flex-direction: column;
        gap: 1rem;
    }
}`;

    await fs.writeFile(
      path.join(projectPath, 'styles', 'main.css'),
      cssTemplate
    );

    // JavaScript
    const jsTemplate = `
// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // Initialize contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Initialize analytics
    initializeAnalytics();
});

function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Send form data to server
    fetch('/api/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert('Thank you for your message! We\'ll get back to you soon.');
        e.target.reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was an error sending your message. Please try again.');
    });
}

function initializeAnalytics() {
    // Track page views
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: document.title,
            page_location: window.location.href
        });
    }
    
    // Track custom events
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn')) {
            trackEvent('button_click', {
                button_text: e.target.textContent,
                button_class: e.target.className
            });
        }
    });
}

function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
}`;

    await fs.writeFile(
      path.join(projectPath, 'scripts', 'main.js'),
      jsTemplate
    );
  }

  async generateAnalyticsIntegration(project, projectPath) {
    const analyticsScript = `
// LyraLytics Analytics Integration
class LyraLyticsAnalytics {
    constructor() {
        this.projectId = '${project.id}';
        this.endpoint = '${process.env.DASHBOARD_URL || 'http://localhost:3000'}/api/analytics';
        this.initialize();
    }
    
    initialize() {
        this.trackPageView();
        this.trackUserBehavior();
        this.trackConversions();
    }
    
    trackPageView() {
        const pageData = {
            projectId: this.projectId,
            page: window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
        
        this.sendData('pageview', pageData);
    }
    
    trackUserBehavior() {
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (maxScroll % 25 === 0) { // Track every 25%
                    this.sendData('scroll', { depth: maxScroll });
                }
            }
        });
        
        // Track time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - startTime;
            this.sendData('time_on_page', { duration: timeOnPage });
        });
    }
    
    trackConversions() {
        // Track form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('form')) {
                this.sendData('form_submission', {
                    formId: e.target.id || 'unknown',
                    formAction: e.target.action
                });
            }
        });
        
        // Track button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, button')) {
                this.sendData('button_click', {
                    buttonText: e.target.textContent,
                    buttonClass: e.target.className
                });
            }
        });
    }
    
    sendData(eventType, data) {
        const payload = {
            eventType,
            projectId: this.projectId,
            timestamp: new Date().toISOString(),
            ...data
        };
        
        // Send to LyraLytics API
        fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.error('LyraLytics tracking error:', error);
        });
    }
}

// Initialize analytics
if (typeof window !== 'undefined') {
    window.lyralytics = new LyraLyticsAnalytics();
}`;

    await fs.writeFile(
      path.join(projectPath, 'scripts', 'lyralytics.js'),
      analyticsScript
    );
  }

  async buildProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const projectPath = path.join(process.cwd(), 'projects', projectId);
    const buildPath = path.join(process.cwd(), 'builds', projectId);

    // Clean build directory
    await fs.remove(buildPath);
    await fs.ensureDir(buildPath);

    // Copy project files
    await fs.copy(projectPath, buildPath);

    // Optimize assets
    await this.optimizeAssets(buildPath);

    // Generate sitemap
    await this.generateSitemap(project, buildPath);

    // Generate robots.txt
    await this.generateRobotsTxt(project, buildPath);

    project.status = 'built';
    project.buildPath = buildPath;

    return buildPath;
  }

  async optimizeAssets(buildPath) {
    const assetsPath = path.join(buildPath, 'assets');
    if (await fs.pathExists(assetsPath)) {
      const files = await fs.readdir(assetsPath);
      
      for (const file of files) {
        if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
          const filePath = path.join(assetsPath, file);
          await this.optimizeImage(filePath);
        }
      }
    }
  }

  async optimizeImage(filePath) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // Resize if too large
      if (metadata.width > 1920) {
        await image.resize(1920).toFile(filePath + '.tmp');
        await fs.move(filePath + '.tmp', filePath, { overwrite: true });
      }
      
      // Optimize quality
      await image.jpeg({ quality: 85 }).toFile(filePath + '.tmp');
      await fs.move(filePath + '.tmp', filePath, { overwrite: true });
    } catch (error) {
      console.error('Error optimizing image:', error);
    }
  }

  async generateSitemap(project, buildPath) {
    const template = this.templates.get(project.template);
    const baseUrl = `https://${project.domain}`;
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const page of template.structure.pages) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/${page === 'home' ? '' : page}.html</loc>\n`;
      sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>${page === 'home' ? '1.0' : '0.8'}</priority>\n`;
      sitemap += `  </url>\n`;
    }
    
    sitemap += '</urlset>';
    
    await fs.writeFile(path.join(buildPath, 'sitemap.xml'), sitemap);
  }

  async generateRobotsTxt(project, buildPath) {
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://${project.domain}/sitemap.xml

# Analytics tracking
Allow: /analytics/
Allow: /api/analytics/`;
    
    await fs.writeFile(path.join(buildPath, 'robots.txt'), robotsTxt);
  }

  async deployProject(projectId, deploymentConfig) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Build project first
    const buildPath = await this.buildProject(projectId);

    // Deploy based on configuration
    switch (deploymentConfig.type) {
      case 'local':
        return await this.deployLocal(project, buildPath);
      
      case 'ftp':
        return await this.deployFTP(project, buildPath, deploymentConfig);
      
      case 's3':
        return await this.deployS3(project, buildPath, deploymentConfig);
      
      default:
        throw new Error(`Unknown deployment type: ${deploymentConfig.type}`);
    }
  }

  async deployLocal(project, buildPath) {
    const port = process.env.WEBSITE_PORT || 3001;
    
    // Start local server
    const express = require('express');
    const app = express();
    
    app.use(express.static(buildPath));
    
    app.listen(port, () => {
      console.log(`🌐 Website deployed locally at http://localhost:${port}`);
    });

    project.status = 'deployed';
    project.deploymentUrl = `http://localhost:${port}`;
    
    return project.deploymentUrl;
  }

  async deployFTP(project, buildPath, config) {
    // FTP deployment implementation
    console.log('📤 Deploying via FTP...');
    
    // This would integrate with an FTP library
    // For now, just simulate deployment
    
    project.status = 'deployed';
    project.deploymentUrl = `https://${project.domain}`;
    
    return project.deploymentUrl;
  }

  async deployS3(project, buildPath, config) {
    // S3 deployment implementation
    console.log('📤 Deploying to S3...');
    
    // This would integrate with AWS SDK
    // For now, just simulate deployment
    
    project.status = 'deployed';
    project.deploymentUrl = `https://${project.domain}`;
    
    return project.deploymentUrl;
  }

  // Public API methods
  getTemplates() {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      ...template
    }));
  }

  getProjects() {
    return Array.from(this.projects.entries()).map(([id, project]) => ({
      id,
      ...project
    }));
  }

  async getProject(projectId) {
    return this.projects.get(projectId);
  }

  async updateProject(projectId, updates) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    Object.assign(project, updates);
    project.updatedAt = new Date();

    return project;
  }

  async deleteProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Remove project files
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    await fs.remove(projectPath);

    // Remove build files
    const buildPath = path.join(process.cwd(), 'builds', projectId);
    await fs.remove(buildPath);

    // Remove from projects map
    this.projects.delete(projectId);

    return true;
  }
}

// Example usage and testing
async function demonstrateWebsiteBuilder() {
  console.log('🌐 LyraLytics Website Builder Demo\n');

  const builder = new WebsiteBuilder();
  
  try {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📋 Available Templates:');
    const templates = builder.getTemplates();
    templates.forEach(template => {
      console.log(`  • ${template.name}: ${template.description}`);
      console.log(`    Features: ${template.features.join(', ')}`);
    });

    console.log('\n🏗️ Creating Sample Project...');
    const projectId = await builder.createProject({
      name: 'Demo Business',
      template: 'business',
      domain: 'demobusiness.com',
      features: ['responsive', 'seo', 'analytics'],
      analytics: {
        googleAnalytics: 'GA-123456789',
        lyralytics: true
      }
    });

    console.log(`✅ Project created: ${projectId}`);

    console.log('\n🔨 Building Project...');
    const buildPath = await builder.buildProject(projectId);
    console.log(`✅ Project built: ${buildPath}`);

    console.log('\n🚀 Deploying Project...');
    const deploymentUrl = await builder.deployProject(projectId, { type: 'local' });
    console.log(`✅ Project deployed: ${deploymentUrl}`);

    console.log('\n📊 Project Details:');
    const project = await builder.getProject(projectId);
    console.log(project);

    console.log('\n✅ Website Builder demo completed successfully!');

  } catch (error) {
    console.error('❌ Website Builder demo failed:', error);
  }
}

module.exports = {
  WebsiteBuilder,
  demonstrateWebsiteBuilder
};

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateWebsiteBuilder();
} 