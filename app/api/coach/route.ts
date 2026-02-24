import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleGenAI } from '@google/genai'
import { UserState } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userState, prompt }: { userState: UserState; prompt?: string } =
      await request.json()

    const systemInstruction = `أنت مدرب تطوير ذاتي (Coach) ومحاسب شخصي لنظام اسمه "حصاد". 
مهمتك هي تحليل بيانات المستخدم (العادات، الأهداف، السجلات اليومية) وتقديم نصائح عملية، تشجيع، أو محاسبة بلهجة حازمة ومحفزة عند التقصير.
دائماً تحدث باللغة العربية. ركز على البيانات التي يقدمها المستخدم.
بيانات المستخدم الحالية: ${JSON.stringify(userState)}`

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt || 'قم بتحليل تقدمي الحالي وقدم لي ملخصاً ذكياً ونصيحة واحدة للتحسن.',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    })

    return NextResponse.json({ text: response.text })
  } catch (error) {
    console.error('Coach API error:', error)
    return NextResponse.json({ error: 'فشل الاتصال بالمدرب الذكي' }, { status: 500 })
  }
}
