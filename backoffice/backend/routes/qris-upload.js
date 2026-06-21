const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/outlets/:id/qris - Get QRIS static URL
router.get('/:id/qris', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('outlets')
      .select('qris_static_url')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json({ qris_static_url: data?.qris_static_url || null });
  } catch (error) {
    console.error('Get QRIS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/outlets/:id/qris/upload - Upload QRIS image
router.post('/:id/qris/upload', async (req, res) => {
  const { id } = req.params;
  const { imageBase64, fileName } = req.body;
  
  try {
    // Validate input
    if (!imageBase64 || !fileName) {
      return res.status(400).json({ error: 'imageBase64 and fileName required' });
    }
    
    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Validate file size (max 2MB)
    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 2MB limit' });
    }
    
    // Upload to Supabase Storage
    const fileExt = fileName.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png'];
    
    if (!allowedExts.includes(fileExt)) {
      return res.status(400).json({ error: 'Only JPG, JPEG, PNG files allowed' });
    }
    
    const filePath = `qris/${id}-${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('outlet-assets')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('outlet-assets')
      .getPublicUrl(filePath);
    
    const qrisUrl = publicUrlData.publicUrl;
    
    // Update outlet with QRIS URL
    const { data, error } = await supabase
      .from('outlets')
      .update({ qris_static_url: qrisUrl })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✓ QRIS uploaded successfully:', qrisUrl);
    
    res.json({ 
      success: true, 
      qris_static_url: qrisUrl,
      message: 'QRIS berhasil diupload' 
    });
  } catch (error) {
    console.error('Upload QRIS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/outlets/:id/qris - Remove QRIS
router.delete('/:id/qris', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('outlets')
      .update({ qris_static_url: null })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✓ QRIS removed for outlet:', id);
    
    res.json({ success: true, message: 'QRIS berhasil dihapus' });
  } catch (error) {
    console.error('Delete QRIS error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
