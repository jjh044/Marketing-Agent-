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
  followers: document.querySelector("#followers"),
  engagement: document.querySelector("#engagement"),
  country: document.querySelector("#country"),
  decisionStatus: document.querySelector("#decisionStatus"),
  reasonList: document.querySelector("#reasonList"),
  messageDraft: document.querySelector("#messageDraft"),
  emailTab: document.querySelector("#emailTab"),
  dmTab: document.querySelector("#dmTab"),
  approveButton: document.querySelector("#approveButton"),
  rejectButton: document.querySelector("#rejectButton")
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getStatus(candidate) {
  return candidate.decision?.status ?? "pending";
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
    const creator = candidate.creator;
    const status = getStatus(candidate);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `creator-row${candidate.id === selectedId ? " active" : ""}`;
    button.innerHTML = `
      <div class="creator-row-top">
        <strong>${creator.displayName}</strong>
        <span class="pill ${status}">${status}</span>
      </div>
      <p>${creator.platform} ${creator.handle} · ${formatNumber(creator.followers)} followers</p>
      <p>${candidate.score.total}/100 · ${candidate.score.recommendation} · ${creator.specificContentAngle}</p>
    `;
    button.addEventListener("click", () => {
      selectedId = candidate.id;
      activeDraft = "email";
      render();
    });
    elements.creatorList.append(button);
  }

  if (!candidates.some((candidate) => candidate.id === selectedId)) {
    selectedId = candidates[0]?.id ?? null;
  }
}

function renderDetail() {
  const candidate = dashboard.candidates.find((item) => item.id === selectedId);

  if (!candidate) {
    elements.emptyState.classList.remove("hidden");
    elements.detailPanel.classList.add("hidden");
    return;
  }

  const creator = candidate.creator;
  const status = getStatus(candidate);

  elements.emptyState.classList.add("hidden");
  elements.detailPanel.classList.remove("hidden");
  elements.creatorMeta.textContent = `${creator.platform} ${creator.handle} · ${candidate.score.recommendation}`;
  elements.creatorName.textContent = creator.displayName;
  elements.scoreBadge.textContent = `${candidate.score.total}`;
  elements.followers.textContent = formatNumber(creator.followers);
  elements.engagement.textContent = creator.engagementLevel;
  elements.country.textContent = `${creator.country}, ${creator.language}`;
  elements.decisionStatus.textContent = status;

  elements.reasonList.innerHTML = "";
  for (const reason of candidate.score.reasons) {
    const item = document.createElement("li");
    item.textContent = reason;
    elements.reasonList.append(item);
  }

  elements.emailTab.classList.toggle("active", activeDraft === "email");
  elements.dmTab.classList.toggle("active", activeDraft === "dm");
  elements.messageDraft.value = candidate.drafts[activeDraft];
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

elements.approveButton.addEventListener("click", () => decide("approved"));
elements.rejectButton.addEventListener("click", () => decide("rejected"));

await loadDashboard();
