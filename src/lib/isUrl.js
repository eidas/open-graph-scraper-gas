/**
 * URL検証ロジック（簡略版）
 */
function isUrl(url, options) {
  if (!url || typeof url !== 'string') return false;
  
  // URLの基本的な検証
  const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
  return urlRegex.test(url);
}

export default isUrl;