const express = require('express');
const router = express.Router();
const WebpayPlus = require('transbank-sdk').WebpayPlus;

router.post('/create', async (req, res) => {
  try {
    const { amount, sessionId, buyOrder, returnUrl } = req.body;
    const createResponse = await (new WebpayPlus.Transaction()).create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );

    res.json({
      success: true,
      token: createResponse.token,
      url: createResponse.url
    });
  } catch (error) {
    console.error('Error creating Webpay transaction:', error);
    res.status(500).json({ success: false, message: 'Webpay init error' });
  }
});

router.post('/commit', async (req, res) => {
  try {
    const { token_ws } = req.body;
    const commitResponse = await (new WebpayPlus.Transaction()).commit(token_ws);
    
    // Phase 6 unifying logic: Record the successful Transbank transaction in Supabase
    // const { data, error } = await supabase.from('ventas').insert({...})
    
    res.json({
      success: true,
      data: commitResponse
    });
  } catch (error) {
    console.error('Error committing Webpay transaction:', error);
    res.status(500).json({ success: false, message: 'Webpay commit error' });
  }
});

module.exports = router;
