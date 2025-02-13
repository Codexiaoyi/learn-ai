module.exports = {
  plugins: [
    'tailwindcss',  // 确保这里引用的是 tailwindcss 而不是 @tailwindcss/postcss
    'autoprefixer',
    '@tailwindcss/postcss',  // 引入 @tailwindcss/postcss 插件
  ],
};