# Prompt Enhancer for Perplexity Comet

A Chrome extension designed specifically for **Perplexity Comet** that transforms your prompts using the proven CRAFT methodology to generate more targeted, effective AI responses.

## 🎯 What Makes This Different

Unlike generic prompt enhancement tools, this extension is purpose-built for Perplexity Comet and implements the **CRAFT method** - a structured approach to prompt engineering that delivers consistently better results.

### The CRAFT Method

This extension applies the proven CRAFT framework to transform your prompts:

- **C**ontext - Describes the current situation and outlines what knowledge/expertise the LLM should reference
- **R**ole - Defines the LLM as an industry-leading expert with 20+ years of relevant experience and thought leadership
- **A**ction - Provides numbered sequential steps for the LLM to follow to maximize success
- **F**ormat - Specifies the structural arrangement and presentation style (essay, table, markdown, etc.)
- **T**arget Audience - Identifies the ultimate consumer of the output with demographic and preference details

This methodology ensures prompts are comprehensive, detailed, and leave nothing to question - resulting in LLM outputs that far exceed typical responses.

## ✨ Features

- **One-click prompt enhancement** using CRAFT principles
- **Perplexity Comet integration** - seamlessly works within your browser
- **Multiple enhancement modes** - clarity, detail, professional, and creative styles
- **Enhancement history** - tracks and saves your prompt improvements
- **Groq API integration** - powered by fast, efficient LLM processing

## 🚀 Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension will appear in your browser toolbar

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Build for development (with watch mode)
npm run dev

# Build for production
npm run build

# Clean build directory
npm run clean
```

### Project Structure
```
src/
├── background/     # Extension background scripts
├── content/        # Content scripts for page interaction
├── popup/          # Extension popup UI (React)
└── shared/         # Shared utilities and types
```

## 📖 Usage

1. Navigate to Perplexity Comet
2. Click the Prompt Enhancer icon in your toolbar
3. Enter your original prompt
4. Review the CRAFT-enhanced version
5. Copy or directly submit the improved prompt

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Groq API integration concept inspired by [ramin4251/LLM-Prompt-Enhancer](https://github.com/ramin4251/LLM-Prompt-Enhancer)
- CRAFT method framework for structured prompt engineering
- Built for the Perplexity Comet browser ecosystem
