export default function handler(req,res){res.status(501).json({status:"browser-compute",notice:"Model analysis runs locally in the HTML Web Worker; no server API is required."});}
