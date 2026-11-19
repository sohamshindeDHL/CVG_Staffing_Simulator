const sortSpanOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const volumeSlider = document.getElementById("volume");
const sortSpanSlider = document.getElementById("sortSpan");
const leadPositionInput = document.getElementById("leadPosition");
const breakType = document.getElementById("breakType");
const processList = document.getElementById("processList");

const volumeValue = document.getElementById("volumeValue");
const sortSpanValue = document.getElementById("sortSpanValue");
const leadPositionValue = document.getElementById("leadPositionValue");
const breakTypeValue = document.getElementById("breakTypeValue");
const summaryText = document.getElementById("summaryText");
const kpiVolume = document.getElementById("kpiVolume");
const kpiSortSpan = document.getElementById("kpiSortSpan");
const kpiWorkRate = document.getElementById("kpiWorkRate");
const kpiStaff = document.getElementById("kpiStaff");

const processWorkRates = [
  { process: "Receiving", workRate: 50 },
  { process: "Sorting", workRate: 60 },
  { process: "Packing", workRate: 70 },
  { process: "Dispatch", workRate: 80 },
  { process: "Quality Check", workRate: 55 },
  { process: "Labeling", workRate: 65 },
  { process: "Inventory", workRate: 45 },
  { process: "Returns", workRate: 35 },
  { process: "Rework", workRate: 30 },
  { process: "Final Audit", workRate: 50 }
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getBreakReductionRate() {
  const selectedBreak = Number(breakType.value || 0);
  if (selectedBreak === 15) return 0.1;
  if (selectedBreak === 30) return 0.2;
  return 0;
}

function getSelectedSortSpan() {
  const index = Number(sortSpanSlider.value);
  return sortSpanOptions[index];
}

function getEffectiveVolume() {
  const selectedVolume = Number(volumeSlider.value) || 0;
  const reductionRate = getBreakReductionRate();
  return Math.max(selectedVolume * (1 - reductionRate), 0);
}

function getLeadPositionStaff() {
  return Math.max(Number(leadPositionInput.value) || 0, 0);
}

function calculateProcessStaff(volume, sortSpan, workRate) {
  const safeWorkRate = Math.max(Number(workRate) || 0, 1);
  return Math.max(1, Math.ceil(volume / (sortSpan * safeWorkRate)));
}

function getTotalProcessWorkRate() {
  return processWorkRates.reduce((sum, item) => sum + Math.max(Number(item.workRate) || 0, 0), 0);
}

function updateLeadPositionDisplay() {
  leadPositionValue.textContent = `${formatNumber(getLeadPositionStaff())} headcount`;
}

function updateBreakDisplay() {
  const selectedBreak = Number(breakType.value || 0);
  const label = selectedBreak === 0 ? "No break" : `${selectedBreak} min break`;
  breakTypeValue.textContent = label;
}

function renderProcessList() {
  processList.innerHTML = "";

  processWorkRates.forEach((item, index) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = item.process;
    nameInput.className = "process-name-input";
    nameInput.dataset.index = String(index);
    nameCell.appendChild(nameInput);

    const rateCell = document.createElement("td");
    const rateInput = document.createElement("input");
    rateInput.type = "number";
    rateInput.min = "1";
    rateInput.step = "1";
    rateInput.value = item.workRate;
    rateInput.className = "process-rate-input";
    rateInput.dataset.index = String(index);
    rateCell.appendChild(rateInput);

    const staffCell = document.createElement("td");
    staffCell.className = "process-staff";
    staffCell.dataset.index = String(index);

    row.appendChild(nameCell);
    row.appendChild(rateCell);
    row.appendChild(staffCell);
    processList.appendChild(row);
  });

  updateProcessRows();
}

function updateProcessRows() {
  const volume = getEffectiveVolume();
  const sortSpan = getSelectedSortSpan();

  const rows = processList.querySelectorAll("tr");
  rows.forEach((row, index) => {
    const nameInput = row.querySelector(".process-name-input");
    const rateInput = row.querySelector(".process-rate-input");
    const staffCell = row.querySelector(".process-staff");

    const safeProcessName = (nameInput.value || "").trim() || `Process ${index + 1}`;
    const workRate = Math.max(Number(rateInput.value) || 0, 0);

    processWorkRates[index].process = safeProcessName;
    processWorkRates[index].workRate = workRate;

    const staffNeeded = calculateProcessStaff(volume, sortSpan, workRate);
    staffCell.textContent = formatNumber(staffNeeded);
  });
}

function updateDashboard() {
  const selectedVolume = Number(volumeSlider.value) || 0;
  const effectiveVolume = getEffectiveVolume();
  const sortSpan = getSelectedSortSpan();
  const totalProcessWorkRate = getTotalProcessWorkRate();
  const processStaffing = processWorkRates.map((item) => calculateProcessStaff(effectiveVolume, sortSpan, item.workRate));
  const totalProcessStaffNeeded = processStaffing.reduce((sum, item) => sum + item, 0);
  const leadPosition = getLeadPositionStaff();
  const totalStaffNeeded = totalProcessStaffNeeded + leadPosition;
  const breakReduction = getBreakReductionRate();

  volumeValue.textContent = `${formatNumber(effectiveVolume)} pieces`;
  sortSpanValue.textContent = `${sortSpan} hour${sortSpan !== 1 ? "s" : ""}`;
  kpiVolume.textContent = formatNumber(effectiveVolume);
  kpiSortSpan.textContent = `${sortSpan}h`;
  kpiWorkRate.textContent = formatNumber(totalProcessWorkRate);
  kpiStaff.textContent = formatNumber(totalStaffNeeded);

  const breakText = breakReduction > 0 ? `, with a ${Number(breakType.value)} min break reducing the effective volume from ${formatNumber(selectedVolume)} to ${formatNumber(effectiveVolume)} pieces` : "";
  summaryText.textContent = `Based on a selected volume of ${formatNumber(selectedVolume)} pieces${breakText}, a ${sortSpan}-hour sort span, and a total process work rate of ${formatNumber(totalProcessWorkRate)} pieces per hour, the total headcount requirement is ${formatNumber(totalStaffNeeded)} across all process steps, including ${formatNumber(leadPosition)} lead position${leadPosition === 1 ? "" : "s"}.`;
}

processList.addEventListener("input", (event) => {
  const target = event.target;
  if (!target.classList) return;

  if (target.classList.contains("process-name-input") || target.classList.contains("process-rate-input")) {
    updateProcessRows();
    updateDashboard();
  }
});

volumeSlider.addEventListener("input", () => {
  updateProcessRows();
  updateDashboard();
});

sortSpanSlider.addEventListener("input", () => {
  updateProcessRows();
  updateDashboard();
});

breakType.addEventListener("change", () => {
  updateBreakDisplay();
  updateProcessRows();
  updateDashboard();
});

leadPositionInput.addEventListener("input", () => {
  updateLeadPositionDisplay();
  updateDashboard();
});

updateBreakDisplay();
updateLeadPositionDisplay();
renderProcessList();
updateDashboard();