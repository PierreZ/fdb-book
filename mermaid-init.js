let mermaid_theme = 'dark';
if (theme === 'light' || theme === 'rust') {
    mermaid_theme = 'base';
}
mermaid.initialize({theme: mermaid_theme, startOnLoad:true});