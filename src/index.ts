import { loadCampaign, loadCreatorCandidates } from "./data.js";
import { runAgent } from "./agent.js";

const [campaign, creators] = await Promise.all([loadCampaign(), loadCreatorCandidates()]);

runAgent(campaign, creators);
