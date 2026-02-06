/**
 * Drug Interactions Database
 * Contains common dangerous drug combinations for neurosurgery
 */

const DRUG_INTERACTIONS = {
    // Anticoagulants
    'warfarin': {
        dangerous: ['aspirin', 'clopidogrel', 'heparin', 'rivaroxaban', 'dabigatran', 'apixaban'],
        warning: 'خطر نزيف حاد! لا تستخدم مضادات تخثر متعددة معاً.',
        severity: 'high'
    },
    'aspirin': {
        dangerous: ['warfarin', 'clopidogrel', 'ibuprofen', 'naproxen', 'diclofenac'],
        warning: 'خطر نزيف هضمي! تجنب الجمع مع مضادات التخثر أو NSAIDs.',
        severity: 'high'
    },
    'clopidogrel': {
        dangerous: ['warfarin', 'aspirin', 'heparin'],
        warning: 'خطر نزيف شديد! الجمع مع مضادات تخثر أخرى خطر جداً.',
        severity: 'high'
    },

    // NSAIDs
    'ibuprofen': {
        dangerous: ['aspirin', 'naproxen', 'diclofenac', 'warfarin'],
        warning: 'خطر نزيف + قرحة معدية. تجنب مضادات الالتهاب المتعددة.',
        severity: 'medium'
    },
    'diclofenac': {
        dangerous: ['aspirin', 'ibuprofen', 'warfarin', 'methotrexate'],
        warning: 'خطر نزيف ومضاعفات كلوية. لا تجمع مع NSAIDs أخرى.',
        severity: 'medium'
    },

    // Anticonvulsants
    'carbamazepine': {
        dangerous: ['phenytoin', 'phenobarbital', 'warfarin', 'doxycycline'],
        warning: 'تداخل مع الأدوية الأخرى - يقلل فعاليتها.',
        severity: 'medium'
    },
    'phenytoin': {
        dangerous: ['carbamazepine', 'warfarin', 'dexamethasone', 'levodopa'],
        warning: 'تداخل استقلابي خطير - مراقبة المستويات ضرورية.',
        severity: 'medium'
    },
    'valproate': {
        dangerous: ['lamotrigine', 'aspirin', 'warfarin'],
        warning: 'خطر تسمم أو نزيف. ضبط الجرعات ضروري.',
        severity: 'high'
    },

    // Opioids
    'tramadol': {
        dangerous: ['fluoxetine', 'paroxetine', 'sertraline', 'ondansetron'],
        warning: 'خطر متلازمة السيروتونين! تجنب مع مضادات الاكتئاب.',
        severity: 'high'
    },
    'morphine': {
        dangerous: ['midazolam', 'diazepam', 'lorazepam', 'alcohol'],
        warning: 'خطر تثبيط تنفسي شديد! تجنب مع المهدئات.',
        severity: 'high'
    },

    // Antibiotics
    'metronidazole': {
        dangerous: ['warfarin', 'lithium', 'alcohol'],
        warning: 'تداخلات خطيرة - مراقبة دقيقة مطلوبة.',
        severity: 'medium'
    },
    'ciprofloxacin': {
        dangerous: ['theophylline', 'warfarin', 'tizanidine'],
        warning: 'يزيد تركيز الأدوية الأخرى - خطر تسمم.',
        severity: 'medium'
    },

    // Steroids
    'dexamethasone': {
        dangerous: ['aspirin', 'ibuprofen', 'warfarin', 'phenytoin'],
        warning: 'خطر قرحة معدية ونزيف. يقلل فعالية مضادات التخثر.',
        severity: 'medium'
    },
    'prednisolone': {
        dangerous: ['aspirin', 'ibuprofen', 'warfarin', 'nsaids'],
        warning: 'خطر قرحة ونزيف هضمي. تجنب مع NSAIDs.',
        severity: 'medium'
    },

    // Muscle Relaxants
    'baclofen': {
        dangerous: ['alcohol', 'morphine', 'tramadol', 'diazepam'],
        warning: 'تأثير مُثبط للجهاز العصبي - خطر تثبيط تنفسي.',
        severity: 'medium'
    },
    'tizanidine': {
        dangerous: ['ciprofloxacin', 'fluvoxamine', 'alcohol'],
        warning: 'خطر انخفاض ضغط شديد وإغماء.',
        severity: 'high'
    },

    // Antidepressants
    'fluoxetine': {
        dangerous: ['tramadol', 'triptans', 'linezolid', 'selegiline'],
        warning: 'خطر متلازمة السيروتونين القاتلة!',
        severity: 'high'
    },
    'amitriptyline': {
        dangerous: ['epinephrine', 'tramadol', 'alcohol'],
        warning: 'تداخل خطير - مراقبة القلب ضرورية.',
        severity: 'medium'
    }
};

/**
 * Common allergies database
 */
const COMMON_ALLERGIES = {
    'penicillin': ['amoxicillin', 'ampicillin', 'penicillin', 'augmentin', 'unasyn'],
    'sulfa': ['sulfamethoxazole', 'trimethoprim', 'bactrim', 'septrin'],
    'nsaids': ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'ketorolac'],
    'opioids': ['morphine', 'codeine', 'tramadol', 'fentanyl', 'oxycodone']
};

/**
 * Check for drug interactions
 */
function checkDrugInteractions(prescriptionText) {
    const interactions = [];
    const drugsInPrescription = extractDrugsFromText(prescriptionText);

    // Check each drug against others
    for (let i = 0; i < drugsInPrescription.length; i++) {
        const drug1 = drugsInPrescription[i].toLowerCase();

        if (DRUG_INTERACTIONS[drug1]) {
            for (let j = i + 1; j < drugsInPrescription.length; j++) {
                const drug2 = drugsInPrescription[j].toLowerCase();

                if (DRUG_INTERACTIONS[drug1].dangerous.includes(drug2)) {
                    interactions.push({
                        drug1: drugsInPrescription[i],
                        drug2: drugsInPrescription[j],
                        warning: DRUG_INTERACTIONS[drug1].warning,
                        severity: DRUG_INTERACTIONS[drug1].severity
                    });
                }
            }
        }
    }

    return interactions;
}

/**
 * Extract drug names from prescription text
 */
function extractDrugsFromText(text) {
    const drugs = [];
    const lines = text.toLowerCase().split('\n');

    lines.forEach(line => {
        // Check against all known drugs
        Object.keys(DRUG_INTERACTIONS).forEach(drug => {
            if (line.includes(drug) || line.includes(drug.replace('-', ' '))) {
                if (!drugs.includes(drug)) {
                    drugs.push(drug);
                }
            }
        });
    });

    return drugs;
}

/**
 * Check patient allergies against prescription
 */
function checkPatientAllergies(prescriptionText, patientAllergies) {
    if (!patientAllergies) return [];

    const warnings = [];
    const drugsInPrescription = extractDrugsFromText(prescriptionText);
    const allergyList = patientAllergies.toLowerCase().split(/[,،]/);

    allergyList.forEach(allergy => {
        const allergyTrimmed = allergy.trim();

        // Check if allergy group exists
        if (COMMON_ALLERGIES[allergyTrimmed]) {
            drugsInPrescription.forEach(drug => {
                if (COMMON_ALLERGIES[allergyTrimmed].includes(drug.toLowerCase())) {
                    warnings.push({
                        drug: drug,
                        allergy: allergyTrimmed,
                        severity: 'critical'
                    });
                }
            });
        }

        // Check direct drug name match
        drugsInPrescription.forEach(drug => {
            if (drug.toLowerCase().includes(allergyTrimmed) || allergyTrimmed.includes(drug.toLowerCase())) {
                warnings.push({
                    drug: drug,
                    allergy: allergyTrimmed,
                    severity: 'critical'
                });
            }
        });
    });

    return warnings;
}

// Export for global access
window.drugInteractionChecker = {
    checkDrugInteractions,
    checkPatientAllergies,
    DRUG_INTERACTIONS,
    COMMON_ALLERGIES
};
