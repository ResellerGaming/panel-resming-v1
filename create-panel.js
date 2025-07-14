
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method Not Allowed'});

  const { name, ram } = req.body || {};
  if (!name || !ram) return res.status(400).json({error:'name & ram diperlukan'});

  // Ambil ENV Vercel
  const {
    PTERO_API_KEY,
    PTERO_URL,
    PTERO_USER_ID,
    PTERO_EGG_ID,
    PTERO_ALLOC_ID
  } = process.env;

  if (!PTERO_API_KEY || !PTERO_URL || !PTERO_USER_ID || !PTERO_EGG_ID || !PTERO_ALLOC_ID) {
    return res.status(500).json({error:'ENV belum lengkap'});
  }

  // Payload API
  const payload = {
    name,
    user: parseInt(PTERO_USER_ID, 10),
    egg:  parseInt(PTERO_EGG_ID, 10),
    docker_image: "ghcr.io/pterodactyl/yolks:java_17",
    startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar",
    environment: { SERVER_JARFILE: "server.jar", BUILD_NUMBER: "latest" },
    limits: { memory: ram, swap: -1, disk: 10240, io: 500, cpu: 0 },
    feature_limits: { databases: 1, allocations: 1 },
    allocation: { default: parseInt(PTERO_ALLOC_ID, 10) }
  };

  try{
    const response = await fetch(`${PTERO_URL}/api/application/servers`, {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${PTERO_API_KEY}`,
        'Content-Type':'application/json',
        'Accept':'Application/vnd.pterodactyl.v1+json'
      },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.errors?.[0]?.detail || response.statusText);

    return res.status(200).json({success:true,identifier:json.attributes?.identifier});
  }catch(err){
    return res.status(500).json({success:false,error:err.message});
  }
}
