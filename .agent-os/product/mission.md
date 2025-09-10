# Product Mission

## Pitch

Looksy is a mobile app that helps individuals, resellers, and estate planners efficiently catalog and value their items by providing AI-powered image analysis and automated price estimation.

## Users

### Primary Customers

- **Tax Donors**: Individuals seeking to donate items for tax write-offs who need accurate valuations
- **Resellers**: Small business owners and individuals who need to quickly catalog and price inventory
- **Estate Planners**: Professionals and families managing belongings for insurance, organization, or estate planning

### User Personas

**Sarah the Reseller** (25-45 years old)
- **Role:** Small business owner / Side hustler
- **Context:** Buys items from estate sales, thrift stores, and garage sales to resell online
- **Pain Points:** Time-consuming manual research for pricing, inconsistent valuation methods, difficulty tracking inventory
- **Goals:** Quickly identify valuable items, get accurate market prices, maintain organized inventory

**Mike the Donor** (35-65 years old)
- **Role:** Homeowner preparing for donation
- **Context:** Cleaning out house, downsizing, or preparing for tax season
- **Pain Points:** Uncertainty about item values, complex tax documentation requirements, time-consuming research
- **Goals:** Maximize tax deductions, simplify donation process, ensure accurate valuations

**Jennifer the Estate Planner** (40-60 years old)
- **Role:** Estate planning professional or family executor
- **Context:** Managing estate inventory, preparing for probate, or insurance documentation
- **Pain Points:** Detailed inventory requirements, time-consuming valuation process, accuracy concerns
- **Goals:** Comprehensive item documentation, accurate valuations for legal/insurance purposes, efficient workflow

## The Problem

### Manual Item Cataloging is Time-Consuming and Inaccurate

Current methods for cataloging and valuing items require extensive manual research, leading to inconsistent results and significant time investment. Users spend hours researching individual items online, often with outdated or inaccurate pricing information.

**Our Solution:** AI-powered image analysis automatically identifies items and provides real-time market valuations.

### Lack of Professional Valuation Tools for Individuals

Most valuation tools are designed for professionals or require expensive subscriptions, leaving individual users without access to accurate, comprehensive valuation services.

**Our Solution:** Democratized access to professional-grade AI analysis through an affordable mobile app.

### Complex Tax Documentation Requirements

Tax write-offs for donations require detailed documentation and accurate valuations, but most people lack the tools and knowledge to meet IRS requirements effectively.

**Our Solution:** Automated generation of detailed item reports with market-based valuations suitable for tax documentation.

## Differentiators

### AI-Powered Multi-API Analysis with Summarization

Unlike single-source valuation apps, we combine Google Cloud Vision, Amazon Rekognition, and AI summarization to generate single comprehensive descriptions instead of multiple fragmented labels. This results in projected higher recognition accuracy through multi-API ensemble analysis and clearer user understanding.

### Visual Item Selection and Interactive Analysis

Unlike traditional cataloging apps that only show lists, we provide interactive photo analysis where users can click items to highlight them visually and override AI suggestions. This results in precise control over what gets analyzed and valued.

### Professional-Grade Accuracy with Consumer Accessibility

Unlike expensive professional valuation services, we provide enterprise-level accuracy through AI analysis while maintaining consumer-friendly pricing and usability. This results in professional-quality valuations at a fraction of traditional costs.

## Key Features

### Core Features

- **AI-Powered Item Detection:** Automatically identifies items from photos using multi-API analysis with Google Cloud Vision and Amazon Rekognition
- **Real-Time Price Estimation:** Provides market-based valuations using eBay API integration with confidence scoring
- **Interactive Photo Analysis:** Visual item selection with bounding box highlighting and click-to-select functionality
- **Comprehensive Item Cataloging:** Organizes items by category with detailed descriptions, confidence scores, and analysis timestamps
- **Data Persistence:** Robust local storage with AsyncStorage integration, data validation, and migration support

### Collaboration Features

- **Export and Reporting:** Generates detailed reports suitable for tax documentation and insurance purposes
- **Batch Processing:** Handles multiple items simultaneously for efficient bulk operations
- **User Override System:** Allows manual correction of AI suggestions with custom categories and descriptions
- **Multi-Selection Management:** Select and manage multiple items for bulk pricing and organization
- **Settings and Preferences:** Customizable analysis settings, category preferences, and data management tools
