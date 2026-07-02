import re

file_path = "design/components/landing/LandingPageClient.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Remove useInViewReveal function
content = re.sub(r'function useInViewReveal\(\) \{[\s\S]*?\}\n\n', '', content)
# Remove useInViewReveal(); call
content = re.sub(r'\s*useInViewReveal\(\);\n', '\n', content)
# Remove data-reveal CSS block
content = re.sub(r'\s*/\* Scroll reveal \*/[\s\S]*?/\* Custom scrollbar \*/', '\n        /* Custom scrollbar */', content)

# Replace <section ... data-reveal>
content = re.sub(r'<section(.*?)data-reveal(.*?)>', r'<motion.section\1initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}\2>', content)
content = re.sub(r'</section>', r'</motion.section>', content)

# Replace <div ... data-reveal data-reveal-stagger="">
content = re.sub(r'<div(.*?)data-reveal data-reveal-stagger=""(.*?)>', r'<motion.div\1initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] }}\2>', content)

# Replace <div ... data-reveal>
content = re.sub(r'<div(.*?)data-reveal(.*?)>', r'<motion.div\1initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}\2>', content)

with open(file_path, "w") as f:
    f.write(content)
