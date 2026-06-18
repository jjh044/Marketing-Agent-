let dashboard = null;
let selectedId = null;
let activeFilter = "all";
let activeDraft = "email";

const elements = {
  sender: document.querySelector("#sender"),
  dailyLimit: document.querySelector("#dailyLimit"),
  approvalRule: document.querySelector("#approvalRule"),
  creatorList: document.querySelector("#creatorList"),
  emptyState: document.querySelector("#emptyState"),
  detailPanel: document.querySelector("#detailPanel"),
  creatorMeta: document.querySelector("#creatorMeta"),
  creatorName: document.querySelector("#creatorName"),
  scoreBadge: document.querySelector("#scoreBadge"),
  metricOneLabel: document.querySelector("#metricOneLabel"),
  metricTwoLabel: document.querySelector("#metricTwoLabel"),
  metricThreeLabel: document.querySelector("#metricThreeLabel"),
  followers: document.querySelector("#followers"),
  engagement: document.querySelector("#engagement"),
  country: document.querySelector("#country"),
  decisionStatus: document.querySelector("#decisionStatus"),
  reasonList: document.querySelector("#reasonList"),
  messageDraft: document.querySelector("#messageDraft"),
  emailTab: document.querySelector("#emailTab"),
  dmTab: document.querySelector("#dmTab"),
  redditTab: document.querySelector("#redditTab"),
  approveButton: document.querySelector("#approveButton"),
  rejectButton: document.querySelector("#rejectButton")
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getStatus(candidate) {
  return candidate.decision?.status ?? "pending";
}

function isReddit(candidate) {
  return candidate.type === "reddit";
}

function filteredCandidates() {
  if (!dashboard) {
    return [];
  }

  if (activeFilter === "all") {
    return dashboard.candidates;
  }

  return dashboard.candidates.filter((candidate) => getStatus(candidate) === activeFilter);
}

function renderShell() {
  const { campaign } = dashboard;
  elements.sender.textContent = `Sender: ${campaign.outreach.senderName}`;
  elements.dailyLimit.textContent = `Daily limit: ${campaign.outreach.maxCreatorsContactedPerDay}`;
  elements.approvalRule.textContent = campaign.outreach.requiresApprovalBeforeEveryMessage
    ? "Approval required"
    : "Auto-send enabled";
}

function renderCreatorList() {
  const candidates = filteredCandidates();
  elements.creatorList.innerHTML = "";

  for (const candidate of candidates) {
    const status = getStatus(candidate);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `creator-row${candidate.id === selectedId ? " active" : ""}`;

    if (isReddit(candidate)) {
      const reddit = candidate.reddit;
      button.innerHTML = `
        <div class="creator-row-top">
          <strong>r/${reddit.subreddit}</strong>
          <span class="pill ${status}">${status}</span>
        </div>
        <p>Reddit post - ${reddit.postTitle}</p>
        <p>${candidate.score.total}/100 - ${candidate.score.recommendation} - ${reddit.intent}</p>
      `;
    } else {
      const creator = candidate.creator;
      button.innerHTML = `
        <div class="creator-row-top">
          <strong>${creator.displayName}</strong>
          <span class="pill ${status}">${status}</span>
        </div>
        <p>${creator.platform} ${creator.handle} - ${formatNumber(creator.followers)} followers</p>
        <p>${candidate.score.total}/100 - ${candidate.score.recommendation} - ${creator.specificContentAngle}</p>
      `;
    }

    button.addEventListener("click", () => {
      selectedId = candidate.id;
      activeDraft = isReddit(candidate) ? "reddit" : "email";
      render();
    });
    elements.creatorList.append(button);
  }

  if (!candidates.some((candidate) => candidate.id === selectedId)) {
    selectedId = candidates[0]?.id ?? null;
  }
}

function renderReasons(candidate) {
  elements.reasonList.innerHTML = "";
  for (const reason of candidate.score.reasons) {
    const item = document.createElement("li");
    item.textContent = reason;
    elements.reasonList.append(item);
  }
}

function renderDraftTabs(candidate) {
  const reddit = isReddit(candidate);
  elements.emailTab.classList.toggle("hidden", reddit);
  elements.dmTab.classList.toggle("hidden", reddit);
  elements.redditTab.classList.toggle("hidden", !reddit);

  if (reddit) {
    activeDraft = "reddit";
  } else if (activeDraft === "reddit") {
    activeDraft = "email";
  }

  elements.emailTab.classList.toggle("active", activeDraft === "email");
  elements.dmTab.classList.toggle("active", activeDraft === "dm");
  elements.redditTab.classList.toggle("active", activeDraft === "reddit");
  elements.messageDraft.value = candidate.drafts[activeDraft] ?? "";
}

function renderDetail() {
  const candidate = dashboard.candidates.find((item) => item.id === selectedId);

  if (!candidate) {
    elements.emptyState.classList.remove("hidden");
    elements.detailPanel.classList.add("hidden");
    return;
  }

  const status = getStatus(candidate);

  elements.emptyState.classList.add("hidden");
  elements.detailPanel.classList.remove("hidden");
  elements.scoreBadge.textContent = `${candidate.score.total}`;
  elements.decisionStatus.textContent = status;

  if (isReddit(candidate)) {
    const reddit = candidate.reddit;
    elements.creatorMeta.textContent = `Reddit - r/${reddit.subreddit} - ${candidate.score.recommendation}`;
    elements.creatorName.textContent = reddit.postTitle;
    elements.metricOneLabel.textContent = "Intent";
    elements.metricTwoLabel.textContent = "Relevance";
    elements.metricThreeLabel.textContent = "Mention App";
    elements.followers.textContent = reddit.intent;
    elements.engagement.textContent = reddit.relevance;
    elements.country.textContent = reddit.shouldMentionApp ? "Yes, with disclosure" : "No";
  } else {
    const creator = candidate.creator;
    elements.creatorMeta.textContent = `${creator.platform} ${creator.handle} - ${candidate.score.recommendation}`;
    elements.creatorName.textContent = creator.displayName;
    elements.metricOneLabel.textContent = "Followers";
    elements.metricTwoLabel.textContent = "Engagement";
    elements.metricThreeLabel.textContent = "Country";
    elements.followers.textContent = formatNumber(creator.followers);
    elements.engagement.textContent = creator.engagementLevel;
    elements.country.textContent = `${creator.country}, ${creator.language}`;
  }

  renderReasons(candidate);
  renderDraftTabs(candidate);
}

function render() {
  renderShell();
  renderCreatorList();
  renderDetail();
}

async function loadDashboard() {
  const response = await fetch("/api/dashboard");
  dashboard = await response.json();
  selectedId = dashboard.candidates[0]?.id ?? null;
  render();
}

async function decide(status) {
  if (!selectedId) {
    return;
  }

  const response = await fetch("/api/decision", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: selectedId, status })
  });

  dashboard = await response.json();
  render();
}

for (const button of document.querySelectorAll(".filter")) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((filter) => {
      filter.classList.toggle("active", filter === button);
    });
    selectedId = null;
    render();
  });
}

elements.emailTab.addEventListener("click", () => {
  activeDraft = "email";
  renderDetail();
});

elements.dmTab.addEventListener("click", () => {
  activeDraft = "dm";
  renderDetail();
});

elements.redditTab.addEventListener("click", () => {
  activeDraft = "reddit";
  renderDetail();
});

elements.approveButton.addEventListener("click", () => decide("approved"));
elements.rejectButton.addEventListener("click", () => decide("rejected"));

await loadDashboard();
