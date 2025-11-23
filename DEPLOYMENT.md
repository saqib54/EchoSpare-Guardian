# Deployment Instructions for Netlify

## Prerequisites
1. A Netlify account (free at [netlify.com](https://netlify.com))
2. A GitHub/GitLab/Bitbucket account (optional but recommended)
3. Your Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

## Method 1: Deploy with Git (Recommended)

1. **Push your code to a Git repository**
   - Create a new repository on GitHub/GitLab/Bitbucket
   - Push your code to the repository:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin YOUR_REPOSITORY_URL
     git push -u origin main
     ```

2. **Connect Netlify to your repository**
   - Log in to your Netlify account
   - Click "New site from Git"
   - Select your Git provider and repository
   - Netlify will automatically detect the build settings from `netlify.toml`

3. **Set Environment Variables**
   - Go to Site settings > Build & deploy > Environment
   - Add the following variable:
     - Key: `VITE_GEMINI_API_KEY`
     - Value: `your_actual_gemini_api_key_here`

4. **Deploy**
   - Click "Deploy site"
   - Your site will be live at the provided Netlify URL

## Method 2: Deploy Manual Upload

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload to Netlify**
   - Log in to your Netlify account
   - Drag and drop the `dist` folder to the Netlify deployment area
   - Or use the Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod
     ```

3. **Set Environment Variables**
   - Go to Site settings > Build & deploy > Environment
   - Add your `VITE_GEMINI_API_KEY` variable

## Troubleshooting

- **API Key Not Working**: Make sure you're using a valid Gemini API key and that it's set as `VITE_GEMINI_API_KEY` in environment variables
- **Build Failures**: Check the Netlify build logs for specific error messages
- **404 Errors on Routes**: The `_redirects` file should handle client-side routing

## Environment Variables

For production deployment, always set your API key in Netlify's environment variables, not in the code.