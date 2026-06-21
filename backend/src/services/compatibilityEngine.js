/**
 * PC Build Compatibility Engine
 *
 * Accepts a build object with any combination of these keys:
 *   { cpu, motherboard, ram, gpu, case, cooler, storage, psu }
 *
 * Each value is the full compatibility_specs object for that component
 * (merged with the product row so top-level fields like name are available).
 *
 * Returns an array of:
 *   { rule: string, passed: boolean, message: string }
 *
 * Only checks rules where all required components are present in the build.
 */

function checkCompatibility(build) {
  const { cpu, motherboard, ram, gpu, case: pcCase, cooler, storage, psu } = build;
  const results = [];

  // Helper: add result
  function addResult(rule, passed, message) {
    results.push({ rule, passed, message });
  }

  // ─── Rule 1: CPU socket === Motherboard socket ───────────────────────────
  if (cpu && motherboard) {
    const passed = cpu.socket_type === motherboard.socket_type;
    addResult(
      'CPU ↔ Motherboard socket',
      passed,
      passed
        ? `CPU and motherboard both use ${cpu.socket_type}`
        : `CPU socket ${cpu.socket_type} is not compatible with motherboard socket ${motherboard.socket_type}`
    );
  }

  // ─── Rule 2: RAM type === Motherboard RAM type ───────────────────────────
  if (ram && motherboard) {
    const passed = ram.ram_type === motherboard.ram_type;
    addResult(
      'RAM ↔ Motherboard RAM type',
      passed,
      passed
        ? `RAM type ${ram.ram_type} matches motherboard`
        : `RAM type ${ram.ram_type} is not compatible with motherboard RAM type ${motherboard.ram_type}`
    );
  }

  // ─── Rule 3: RAM speed ≤ min(CPU max mem speed, Motherboard max mem speed) ─
  if (ram && cpu && motherboard) {
    const effectiveMaxMhz = Math.min(cpu.max_mem_speed_mhz, motherboard.max_mem_speed_mhz);
    const passed = ram.speed_mhz <= effectiveMaxMhz;
    addResult(
      'RAM speed ↔ CPU + Motherboard max memory speed',
      passed,
      passed
        ? `RAM speed ${ram.speed_mhz} MHz is within the supported maximum of ${effectiveMaxMhz} MHz`
        : `RAM speed ${ram.speed_mhz} MHz exceeds the supported maximum of ${effectiveMaxMhz} MHz (CPU max: ${cpu.max_mem_speed_mhz}, motherboard max: ${motherboard.max_mem_speed_mhz})`
    );
  }

  // ─── Rule 4: RAM modules count ≤ Motherboard RAM slots ──────────────────
  if (ram && motherboard) {
    const passed = ram.modules_count <= motherboard.ram_slots;
    addResult(
      'RAM modules ↔ Motherboard RAM slots',
      passed,
      passed
        ? `${ram.modules_count} RAM module(s) fit in ${motherboard.ram_slots} available slot(s)`
        : `${ram.modules_count} RAM module(s) exceed the ${motherboard.ram_slots} available slot(s) on the motherboard`
    );
  }

  // ─── Rule 5: RAM total capacity ≤ Motherboard max RAM capacity ───────────
  if (ram && motherboard) {
    const passed = ram.total_capacity_gb <= motherboard.max_ram_capacity_gb;
    addResult(
      'RAM capacity ↔ Motherboard max RAM capacity',
      passed,
      passed
        ? `${ram.total_capacity_gb} GB RAM is within the motherboard's ${motherboard.max_ram_capacity_gb} GB maximum`
        : `${ram.total_capacity_gb} GB RAM exceeds the motherboard's maximum supported capacity of ${motherboard.max_ram_capacity_gb} GB`
    );
  }

  // ─── Rule 6: Cooler supports CPU socket ─────────────────────────────────
  if (cooler && cpu) {
    const supportedSockets = Array.isArray(cooler.supported_sockets) ? cooler.supported_sockets : [];
    const passed = supportedSockets.includes(cpu.socket_type);
    addResult(
      'Cooler ↔ CPU socket support',
      passed,
      passed
        ? `Cooler supports CPU socket ${cpu.socket_type}`
        : `Cooler does not support CPU socket ${cpu.socket_type} (supports: ${supportedSockets.join(', ') || 'none listed'})`
    );
  }

  // ─── Rule 7: CPU TDP ≤ Cooler TDP handling ──────────────────────────────
  if (cpu && cooler) {
    const passed = cpu.tdp_watts <= cooler.tdp_handling_watts;
    addResult(
      'CPU TDP ↔ Cooler TDP capacity',
      passed,
      passed
        ? `Cooler can handle ${cooler.tdp_handling_watts} W, CPU TDP is ${cpu.tdp_watts} W`
        : `CPU TDP of ${cpu.tdp_watts} W exceeds the cooler's ${cooler.tdp_handling_watts} W capacity`
    );
  }

  // ─── Rule 8: Air cooler height ≤ Case max CPU cooler height ─────────────
  if (cooler && pcCase && cooler.cooler_type === 'Air') {
    const passed = cooler.height_mm <= pcCase.max_cpu_cooler_height_mm;
    addResult(
      'Air cooler height ↔ Case CPU cooler clearance',
      passed,
      passed
        ? `Air cooler height ${cooler.height_mm} mm fits within the case's ${pcCase.max_cpu_cooler_height_mm} mm clearance`
        : `Air cooler height ${cooler.height_mm} mm exceeds the case's ${pcCase.max_cpu_cooler_height_mm} mm CPU cooler clearance`
    );
  }

  // ─── Rule 9: Air cooler RAM clearance ≥ RAM height ──────────────────────
  if (cooler && ram && cooler.cooler_type === 'Air') {
    const ramHeight = ram.height_mm ?? 0;
    const coolerClearance = cooler.ram_clearance_mm ?? 0;
    const passed = coolerClearance >= ramHeight;
    addResult(
      'Air cooler RAM clearance ↔ RAM height',
      passed,
      passed
        ? `Air cooler RAM clearance of ${coolerClearance} mm accommodates RAM height of ${ramHeight} mm`
        : `Air cooler RAM clearance of ${coolerClearance} mm is less than RAM height of ${ramHeight} mm`
    );
  }

  // ─── Rule 10: AIO radiator size ≤ max case radiator clearance ───────────
  if (cooler && pcCase && cooler.cooler_type === 'Liquid') {
    const radiatorSize = cooler.radiator_size_mm;
    const maxClearance = Math.max(
      pcCase.radiator_top_mm ?? 0,
      pcCase.radiator_side_mm ?? 0,
      pcCase.radiator_bottom_mm ?? 0
    );
    const passed = radiatorSize != null && radiatorSize <= maxClearance;
    addResult(
      'AIO radiator size ↔ Case radiator clearance',
      passed,
      passed
        ? `AIO radiator (${radiatorSize} mm) fits in the case's maximum radiator clearance of ${maxClearance} mm`
        : `AIO radiator (${radiatorSize ?? 'unknown'} mm) does not fit in the case's maximum radiator clearance of ${maxClearance} mm`
    );
  }

  // ─── Rule 11: GPU length ≤ Case max GPU length ───────────────────────────
  if (gpu && pcCase) {
    const passed = gpu.length_mm <= pcCase.max_gpu_length_mm;
    addResult(
      'GPU length ↔ Case GPU clearance',
      passed,
      passed
        ? `GPU length ${gpu.length_mm} mm fits within the case's ${pcCase.max_gpu_length_mm} mm maximum`
        : `GPU length ${gpu.length_mm} mm exceeds the case's maximum GPU length of ${pcCase.max_gpu_length_mm} mm`
    );
  }

  // ─── Rule 12: GPU height ≤ Case max GPU height clearance ─────────────────
  if (gpu && pcCase) {
    const gpuHeight = gpu.height_clearance_mm;
    const caseHeight = pcCase.max_gpu_height_clearance_mm;
    if (gpuHeight != null && caseHeight != null) {
      const passed = gpuHeight <= caseHeight;
      addResult(
        'GPU height ↔ Case GPU height clearance',
        passed,
        passed
          ? `GPU height clearance ${gpuHeight} mm fits within the case's ${caseHeight} mm clearance`
          : `GPU height clearance ${gpuHeight} mm exceeds the case's ${caseHeight} mm clearance`
      );
    }
  }

  // ─── Rule 13: (CPU TDP + GPU TDP) × 1.2 ≤ PSU wattage ──────────────────
  if (cpu && gpu && psu) {
    const totalRequired = (cpu.tdp_watts + gpu.tdp_watts) * 1.2;
    const passed = totalRequired <= psu.wattage;
    addResult(
      'System TDP ↔ PSU wattage',
      passed,
      passed
        ? `PSU ${psu.wattage} W covers the estimated system draw of ${Math.ceil(totalRequired)} W (CPU ${cpu.tdp_watts} W + GPU ${gpu.tdp_watts} W + 20% overhead)`
        : `PSU ${psu.wattage} W is insufficient — estimated system draw is ${Math.ceil(totalRequired)} W (CPU ${cpu.tdp_watts} W + GPU ${gpu.tdp_watts} W + 20% overhead)`
    );
  }

  // ─── Rule 14: PSU has all required GPU power connectors ─────────────────
  if (gpu && psu) {
    const requiredConnectors = Array.isArray(gpu.power_connectors) ? gpu.power_connectors : [];

    if (requiredConnectors.length === 0) {
      addResult(
        'PSU ↔ GPU power connectors',
        true,
        'GPU requires no external power connectors'
      );
    } else {
      // Tally available PSU connectors
      const psuAvailable = {
        '12VHPWR': psu.pcie_12vhpwr_connectors ?? 0,
        '8pin': psu.pcie_6plus2_connectors ?? 0,
        '6+2pin': psu.pcie_6plus2_connectors ?? 0,
        '6pin': psu.pcie_6plus2_connectors ?? 0, // 6+2 can serve as 6-pin
      };

      // Count what GPU needs
      const needed = {};
      for (const connector of requiredConnectors) {
        needed[connector] = (needed[connector] ?? 0) + 1;
      }

      const missingList = [];
      const remaining = { ...psuAvailable };

      for (const [type, count] of Object.entries(needed)) {
        const available = remaining[type] ?? 0;
        if (available < count) {
          missingList.push(`${count - available}× ${type}`);
        } else {
          remaining[type] = available - count;
        }
      }

      const passed = missingList.length === 0;
      addResult(
        'PSU ↔ GPU power connectors',
        passed,
        passed
          ? `PSU has all required GPU power connectors (${requiredConnectors.join(', ')})`
          : `PSU is missing GPU power connectors: ${missingList.join(', ')}`
      );
    }
  }

  // ─── Rule 15: Motherboard form factor ∈ Case supported form factors ──────
  if (motherboard && pcCase) {
    const supported = Array.isArray(pcCase.supported_mobo_form_factors)
      ? pcCase.supported_mobo_form_factors
      : [];
    const passed = supported.includes(motherboard.form_factor);
    addResult(
      'Motherboard form factor ↔ Case compatibility',
      passed,
      passed
        ? `Case supports ${motherboard.form_factor} motherboards`
        : `Case does not support ${motherboard.form_factor} motherboards (supports: ${supported.join(', ') || 'none listed'})`
    );
  }

  // ─── Rule 16: PSU form factor ∈ Case supported PSU form factors ──────────
  if (psu && pcCase) {
    const supported = Array.isArray(pcCase.supported_psu_form_factors)
      ? pcCase.supported_psu_form_factors
      : [];
    const passed = supported.includes(psu.form_factor);
    addResult(
      'PSU form factor ↔ Case compatibility',
      passed,
      passed
        ? `Case supports ${psu.form_factor} PSU form factor`
        : `Case does not support ${psu.form_factor} PSU (supports: ${supported.join(', ') || 'none listed'})`
    );
  }

  // ─── Rule 17: Storage interface ↔ Motherboard available slots ────────────
  if (storage && motherboard) {
    const iface = (storage.interface ?? '').toLowerCase();
    const isNvme = iface.includes('nvme') || iface.includes('pcie') || iface.includes('m.2');
    const isSata = iface.includes('sata');

    if (isNvme) {
      const passed = (motherboard.m2_slots_count ?? 0) > 0;
      addResult(
        'NVMe storage ↔ Motherboard M.2 slots',
        passed,
        passed
          ? `Motherboard has ${motherboard.m2_slots_count} M.2 slot(s) for NVMe storage`
          : `Motherboard has no available M.2 slots for NVMe storage`
      );
    } else if (isSata) {
      const passed = (motherboard.sata_ports_count ?? 0) > 0;
      addResult(
        'SATA storage ↔ Motherboard SATA ports',
        passed,
        passed
          ? `Motherboard has ${motherboard.sata_ports_count} SATA port(s) for SATA storage`
          : `Motherboard has no available SATA ports for SATA storage`
      );
    } else {
      addResult(
        'Storage interface ↔ Motherboard slots',
        false,
        `Unrecognized storage interface: "${storage.interface}"`
      );
    }
  }

  return results;
}

module.exports = { checkCompatibility };
