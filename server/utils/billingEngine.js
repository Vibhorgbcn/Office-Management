/**
 * Advanced Billing Rule Engine for Legal Office
 * Calculates fees based on: Client Type + Court + Case Type + Work Type
 */

// Base fee multipliers
const COURT_MULTIPLIERS = {
  'Supreme Court': 2.5,
  'High Court': 1.8,
  'District Court': 1.0,
  'National Criminal Court': 1.2,
  'Special Court': 1.5
};

const CASE_TYPE_MULTIPLIERS = {
  'Criminal': 1.0,
  'Environment Law': 1.3,
  'Civil': 0.9,
  'Constitutional': 2.0,
  'Other': 1.0
};

const WORK_TYPE_MULTIPLIERS = {
  'Drafting': 1.0,
  'Appearance': 1.5,
  'Consultation': 0.8,
  'Research': 0.7,
  'Filing': 0.5
};

// Base rates by client type
const CLIENT_BASE_RATES = {
  regular: {
    hourly: 5000,
    fixed: 50000,
    contingency: 0.15,
    retainer: 100000
  },
  known: {
    hourly: 3000,
    fixed: 30000,
    contingency: 0.10,
    retainer: 60000
  },
  government: {
    hourly: 8000,
    fixed: 100000,
    contingency: 0.20,
    retainer: 200000
  },
  corporate: {
    hourly: 10000,
    fixed: 150000,
    contingency: 0.25,
    retainer: 300000
  },
  'pro-bono': {
    hourly: 0,
    fixed: 0,
    contingency: 0,
    retainer: 0
  }
};

/**
 * Calculate bill amount using advanced rule engine
 * @param {Object} params - Billing parameters
 * @param {String} params.clientType - Client type (regular, known, government, corporate, pro-bono)
 * @param {String} params.court - Court name
 * @param {String} params.caseType - Case type (Criminal, Environment Law, etc.)
 * @param {String} params.workType - Work type (Drafting, Appearance, Consultation)
 * @param {String} params.feeStructure - Fee structure (hourly, fixed, contingency, retainer)
 * @param {Number} params.hours - Hours worked (for hourly)
 * @param {Number} params.caseValue - Case value (for contingency)
 * @returns {Object} Calculated billing details
 */
function calculateBillAmount(params) {
  const {
    clientType = 'regular',
    court = 'District Court',
    caseType = 'Criminal',
    workType = 'Drafting',
    feeStructure = 'fixed',
    hours = 0,
    caseValue = 0
  } = params;

  // Get base rates for client type
  const baseRates = CLIENT_BASE_RATES[clientType] || CLIENT_BASE_RATES.regular;

  // Get multipliers
  const courtMultiplier = COURT_MULTIPLIERS[court] || 1.0;
  const caseTypeMultiplier = CASE_TYPE_MULTIPLIERS[caseType] || 1.0;
  const workTypeMultiplier = WORK_TYPE_MULTIPLIERS[workType] || 1.0;

  // Calculate combined multiplier
  const combinedMultiplier = courtMultiplier * caseTypeMultiplier * workTypeMultiplier;

  let baseAmount = 0;
  let hourlyRate = 0;

  switch (feeStructure) {
    case 'hourly':
      hourlyRate = baseRates.hourly * combinedMultiplier;
      baseAmount = hours * hourlyRate;
      break;

    case 'fixed':
      baseAmount = baseRates.fixed * combinedMultiplier;
      break;

    case 'contingency':
      const contingencyRate = baseRates.contingency;
      // Contingency also affected by court and case type
      baseAmount = caseValue * contingencyRate * (courtMultiplier * caseTypeMultiplier);
      break;

    case 'retainer':
      baseAmount = baseRates.retainer * courtMultiplier;
      break;

    default:
      baseAmount = baseRates.fixed;
  }

  return {
    baseAmount: Math.round(baseAmount),
    hourlyRate: Math.round(hourlyRate),
    multipliers: {
      court: courtMultiplier,
      caseType: caseTypeMultiplier,
      workType: workTypeMultiplier,
      combined: combinedMultiplier
    },
    calculation: {
      clientType,
      court,
      caseType,
      workType,
      feeStructure
    }
  };
}

/**
 * Get suggested fees for a case
 * @param {Object} caseData - Case data
 * @returns {Object} Suggested fees for different work types
 */
function getSuggestedFees(caseData) {
  const { clientType, court, caseType } = caseData;
  const workTypes = ['Drafting', 'Appearance', 'Consultation', 'Research', 'Filing'];
  const suggestions = {};

  workTypes.forEach(workType => {
    suggestions[workType] = {
      hourly: calculateBillAmount({
        clientType,
        court,
        caseType,
        workType,
        feeStructure: 'hourly',
        hours: 1
      }),
      fixed: calculateBillAmount({
        clientType,
        court,
        caseType,
        workType,
        feeStructure: 'fixed'
      })
    };
  });

  return suggestions;
}

module.exports = {
  calculateBillAmount,
  getSuggestedFees,
  CLIENT_BASE_RATES,
  COURT_MULTIPLIERS,
  CASE_TYPE_MULTIPLIERS,
  WORK_TYPE_MULTIPLIERS
};

