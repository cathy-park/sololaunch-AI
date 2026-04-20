import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // 1차 견적 데이터
    const type = formData.get('type') as string;
    const pages = formData.get('pages') as string;
    const components = formData.get('components') as string;
    const boards = formData.get('boards') as string;
    const features = formData.get('features') as string;
    const price_range = formData.get('priceRange') as string;
    const sections = parseInt(formData.get('sections') as string);
    const total_price = parseInt(formData.get('totalPrice') as string);
    const data_readiness = formData.get('dataReadiness') as string;
    const design_level = formData.get('designLevel') as string;

    // 2차 상세 브리프 데이터
    const client_name = formData.get('name') as string;
    const client_email = formData.get('email') as string;
    const client_phone = formData.get('phone') as string;
    const industry = formData.get('industry') as string;
    const target_audience = formData.get('targetAudience') as string;
    const purpose = formData.get('purpose') as string;
    const ref_sites = formData.get('refSites') as string;
    const design_mood = formData.get('designMood') as string;
    const color_tone = formData.get('colorTone') as string;
    const logo_status = formData.get('logoStatus') as string;
    const target_schedule = formData.get('targetSchedule') as string;
    const additional_request = formData.get('additionalRequest') as string;
    const file = formData.get('file') as File | null;

    const isMultilingual = features.includes('다국어 기능');

    let file_url = '';
    if (file && file.size > 0) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;
        
        console.log('Attempting upload to Supabase Storage:', filePath);
        
        const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
        if (uploadError) {
          console.error('SUPABASE_STORAGE_UPLOAD_ERROR:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
          file_url = publicUrl;
          console.log('Upload successful. URL:', file_url);
        }
      } catch (uploadErr) {
        console.error('UNEXPECTED_UPLOAD_EXCEPTION:', uploadErr);
      }
    }

    // DB 저장 (컬럼명이 존재한다고 가정하며 진행)
    const { data: dbData, error: dbError } = await supabase
      .from('interviews')
      .insert([
        {
          type, pages, components, features, price_range, sections, boards, total_price,
          data_readiness, design_level,
          client_name, client_email, client_phone, industry, target_audience, purpose, 
          ref_sites, design_mood, color_tone, logo_status, target_schedule,
          additional_request, file_url, status: '접수'
        }
      ])
      .select().single();

    if (dbError) throw dbError;

    const adminEmail = process.env.ADMIN_EMAIL || 'yany@ddokd.com';
    
    try {
      const emailResponse = await resend.emails.send({
        from: '똑디 인터뷰 <onboarding@resend.dev>', // Resend 무료 티어는 onboarding@resend.dev만 가능
        to: adminEmail,
        subject: `[똑디 신규접수] ${client_name}님의 견적 브리프가 도착했습니다.`,
        html: `
          <div style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #000; padding: 50px; color: #000; background: #fff;">
            <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 30px; border-bottom: 8px solid #000; padding-bottom: 10px; display: inline-block;">NEW INTERVIEW BRIEF</h1>
            
            <!-- 1차 간편 견적 요약 -->
            <div style="background: #000; padding: 30px; color: #fff; margin-bottom: 40px;">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 10px 0; color: #888;">Expected Production Cost</p>
              <p style="font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.02em;">₩ ${price_range}</p>
              <div style="margin-top: 20px; font-size: 11px; color: #666; font-weight: bold;">
                  유형: ${type} | 총 섹션: ${sections}개 | 디자인: ${design_level}
              </div>
            </div>

            <!-- 2차 비즈니스 브리프 상세 -->
            <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border-left: 4px solid #000; padding-left: 10px; margin-bottom: 20px;">Business Brief</h2>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 40px;">
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; width: 120px; font-weight: 900;">고객 정보</td>
                  <td style="padding: 12px 0; font-weight: 700;">${client_name} (${client_phone})</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">이메일</td>
                  <td style="padding: 12px 0;">${client_email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">업종/분야</td>
                  <td style="padding: 12px 0;">${industry}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">타겟 고객</td>
                  <td style="padding: 12px 0;">${target_audience}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">제작 목적</td>
                  <td style="padding: 12px 0;">${purpose}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">참고 사이트</td>
                  <td style="padding: 12px 0;">${ref_sites}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">디자인 무드</td>
                  <td style="padding: 12px 0;">${design_mood}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">선호 컬러 톤</td>
                  <td style="padding: 12px 0;">${color_tone || '미입력'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">로고 상태</td>
                  <td style="padding: 12px 0;">${logo_status}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; color: #888; font-weight: 900;">희망 일정</td>
                  <td style="padding: 12px 0;">${target_schedule}</td>
              </tr>
            </table>

            <div style="background: #f8f8f8; padding: 25px; margin-bottom: 40px;">
              <p style="font-size: 11px; font-weight: 900; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 10px 0;">Additional Request</p>
              <p style="margin: 0; font-size: 13px; line-height: 1.6; font-weight: 500;">${additional_request || '없음'}</p>
            </div>

            ${file_url ? `<div style="margin-bottom: 40px;"><a href="${file_url}" style="font-size: 11px; font-weight: 900; color: #000; text-decoration: underline;">ATTACHED_FILE_DOWNLOAD</a></div>` : ''}
            
            <div style="text-align: center;">
              <a href="${req.headers.get('origin')}/admin/${dbData.id}" style="display: inline-block; padding: 18px 45px; background: #0071e3; color: #fff; text-decoration: none; font-weight: 900; font-size: 12px; letter-spacing: 0.1em; border-radius: 8px;">어드민에서 상세 확인하기</a>
            </div>
          </div>
        `,
      });

      if (emailResponse.error) {
        console.error('Resend email error:', emailResponse.error);
      } else {
        console.log('Resend email sent successfully:', emailResponse.data);
      }
    } catch (emailErr) {
      console.error('Failed to send email via Resend:', emailErr);
    }


    return NextResponse.json({ success: true, id: dbData.id });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
