import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function OffersBanner() {
  const [promo, setPromo] = useState(null)

  useEffect(() => {
    const fetchPromo = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .limit(1)
        .single()
      setPromo(data)
    }
    fetchPromo()
  }, [])

  if (!promo) return null;

  return (
    <div style={{
      background: promo.bg_color || '#0d5c3a',
      color: promo.text_color || '#ffffff',
      textAlign: 'center',
      padding: '10px 16px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      position: 'relative',
      zIndex: 60
    }}>
      <span dangerouslySetInnerHTML={{ __html: promo.message }} />
      <button onClick={() => setPromo(null)}
        style={{marginLeft:'auto', background:'none',
        border:'none', color:'inherit', 
        cursor:'pointer', fontSize:'18px'}}>
        ×
      </button>
    </div>
  )
}
