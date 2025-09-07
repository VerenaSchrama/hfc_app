This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# HerFoodCode App - Mechanism-First Dynamic Workbook (v2.0)

## 🎯 **Current Architecture: Mechanism-First Approach**

The app now uses a **mechanism-first architecture** that provides highly coherent and personalized workbooks:

1. **Mechanism Detection**: GPT-4 analyzes user symptoms and identifies 1-3 key hormonal mechanisms (confidence 70+)
2. **Targeted Strategy Retrieval**: Strategies are specifically retrieved to address each detected mechanism
3. **Intervention Creation**: Interventions are created from mechanism-targeted strategies
4. **Fallback Safety**: General strategies used if mechanism-specific retrieval fails

### **Key Features:**
- **Coherent Workbooks**: Mechanisms and interventions are perfectly aligned
- **High Relevance**: All interventions directly address user's specific mechanisms
- **Dynamic Chat**: Users can ask any question and get relevant responses
- **Confidence-Based**: Only high-confidence mechanisms are included
- **Robust Fallback**: Multiple safety nets prevent empty workbooks

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Vercel Deployment Fix
