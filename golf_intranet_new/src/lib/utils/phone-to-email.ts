/**
 * 전화번호를 Supabase Auth용 이메일 형식으로 변환
 * @param phoneNumber 전화번호 (하이픈 포함 가능)
 * @returns 이메일 형식 (예: 01012345678@golf.local)
 */
export function phoneToEmail(phoneNumber: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  return `${cleanPhone}@golf.local`
}

/**
 * 이메일에서 전화번호 추출
 * @param email 이메일 형식 (예: 01012345678@golf.local)
 * @returns 전화번호 (하이픈 포함)
 */
export function emailToPhone(email: string): string {
  const phone = email.split('@')[0]
  // 010-1234-5678 형식으로 변환
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
  }
  return phone
}

/**
 * 전화번호 포맷팅 (하이픈 추가)
 * @param phoneNumber 전화번호
 * @returns 하이픈이 포함된 전화번호
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[^0-9]/g, '')

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  return phoneNumber
}
