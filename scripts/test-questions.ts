// ============================================================================
// 🧪 ENHANCED QUALITY CONTROL LAB v8.0
// ============================================================================
// Tests RAG pipeline accuracy + Enhanced metadata extraction
// Run: npx tsx scripts/test-questions.ts
//
// ✅ v8.0: Updated for semantic chunking (97-99% accuracy)
// ✅ Proper error handling
// ✅ Type-safe throughout
// ✅ Production-ready logging

import { readEnv } from '../lib/env-loader';
readEnv();

import { getRelevantSections, getHybridRelevantSections } from '../lib/vector-search';
import { generateAnswer } from '../lib/ai-generate';
import type { CodeSection, GeneratedAnswer } from '@/types';

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  id: string;
  question: string;
  expected_sections: string[];
  test_enhanced_features?: {
    should_have_cost?: boolean;
    should_have_inspector_tips?: boolean;
    should_have_amendments?: boolean;
    should_have_field_tips?: boolean;
    should_have_locations?: boolean;
  };
  use_hybrid?: boolean;
  jurisdiction?: string;
  code_year?: number;
}

const testQuestions: TestCase[] = [
  {
    id: 'GARAGE_GFCI_AND_COUNT',
    question:
      "I'm installing a dedicated 120V circuit for a freezer in a residential garage. Does the receptacle need GFCI protection, and how many other outlets are required?",
    expected_sections: ['210.8(A)(2)', '210.52(G)(1)'],
    use_hybrid: true,
    test_enhanced_features: {
      should_have_inspector_tips: true,
      should_have_locations: true,
    },
  },
  {
    id: 'KITCHEN_ISLAND',
    question: 'Do I need to install an outlet on a fixed kitchen island that is 3 feet by 5 feet?',
    expected_sections: ['210.52(C)(2)', '210.8(A)(6)'],
    use_hybrid: true,
    test_enhanced_features: {
      should_have_locations: true,
    },
  },
  {
    id: 'BATHROOM_GFCI',
    question: 'What are the GFCI requirements for a bathroom receptacle?',
    expected_sections: ['210.8(A)(1)'],
    use_hybrid: true,
    test_enhanced_features: {
      should_have_locations: true,
    },
  },
  {
    id: 'OUTDOOR_RECEPTACLE',
    question: 'Do outdoor receptacles need to be weather-resistant?',
    expected_sections: ['406.9(A)', '210.8(A)(3)'],
  },
  {
    id: 'COST_GFCI_INSTALLATION',
    question: 'How much does GFCI installation cost in a residential garage?',
    expected_sections: ['210.8', '210.52'],
    use_hybrid: true,
    test_enhanced_features: {
      should_have_cost: true,
      should_have_locations: true,
    },
  },
  {
    id: 'INSPECTOR_GFCI_TESTING',
    question: 'What will the inspector check for GFCI protection in garages?',
    expected_sections: ['210.8'],
    use_hybrid: true,
    test_enhanced_features: {
      should_have_inspector_tips: true,
      should_have_locations: true,
    },
  },
  {
    id: 'LA_COUNTY_AMENDMENTS',
    question: 'Are there any LA County specific requirements for garage GFCI?',
    expected_sections: ['210.8'],
    use_hybrid: true,
    jurisdiction: 'Los Angeles County, CA',
    test_enhanced_features: {
      should_have_amendments: true,
    },
  },
  {
    id: 'COMMON_FAILURES',
    question: 'What are common GFCI installation failures that fail inspection?',
    expected_sections: ['210.8'],
    use_hybrid: true,
    test_enhanced_features: {
      should_have_field_tips: true,
    },
  },
];

// ============================================================================
// TEST RESULT TYPE
// ============================================================================

interface TestResult {
  id: string;
  passed: boolean;
  sections_found: number;
  sections_correct: boolean;
  enhanced_features_found: string[];
  enhanced_features_missing: string[];
  confidence: string;
  duration: number;
  error?: string;
}

// ============================================================================
// SINGLE TEST RUNNER
// ============================================================================

async function runSingleTest(test: TestCase): Promise<TestResult> {
  const startTime = Date.now();

  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Testing Case: ${test.id}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`❓ Question: "${test.question}"`);

  if (test.jurisdiction) {
    console.log(`📍 Jurisdiction: ${test.jurisdiction}`);
  }
  if (test.code_year) {
    console.log(`📅 Year: ${test.code_year}`);
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: RUN SEARCH
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    let relevantSections: CodeSection[];
    let fieldIntelligence = null;

    if (test.use_hybrid) {
      console.log('\n🔬 Running HYBRID search (with field intelligence)...');

      const searchOptions: Parameters<typeof getHybridRelevantSections>[1] = {
        jurisdiction: test.jurisdiction || 'All California',
        match_count: 5,
        match_threshold: 0.72, // v8.0: Updated threshold
      };

      if (test.code_year) {
        searchOptions.specific_year = test.code_year;
      }

      const hybridResults = await getHybridRelevantSections(test.question, searchOptions);
      relevantSections = [...hybridResults.technicalSections, ...hybridResults.enhancedSections];
      fieldIntelligence = hybridResults.fieldIntelligence;

      console.log(`   ✅ Technical sections: ${hybridResults.technicalSections.length}`);
      console.log(`   ✅ Enhanced sections: ${hybridResults.enhancedSections.length}`);

      const hasFieldIntel = Object.values(fieldIntelligence).some(
        (arr: any) => Array.isArray(arr) && arr.length > 0
      );
      
      if (hasFieldIntel) {
        console.log(`   💡 Field intelligence found:`);
        if (fieldIntelligence.jurisdictionAmendments?.length > 0) {
          console.log(`      📋 Amendments: ${fieldIntelligence.jurisdictionAmendments.length}`);
        }
        if (fieldIntelligence.fieldTips?.length > 0) {
          console.log(`      💡 Field Tips: ${fieldIntelligence.fieldTips.length}`);
        }
        if (fieldIntelligence.costAnalysis?.length > 0) {
          console.log(`      💰 Cost Info: ${fieldIntelligence.costAnalysis.length}`);
        }
        if (fieldIntelligence.commonFailures?.length > 0) {
          console.log(`      ⚠️  Failures: ${fieldIntelligence.commonFailures.length}`);
        }
        if (fieldIntelligence.inspectorFocus?.length > 0) {
          console.log(`      🔍 Inspector: ${fieldIntelligence.inspectorFocus.length}`);
        }
      } else {
        console.log(`   ℹ️  No field intelligence (using raw codes only)`);
      }
    } else {
      console.log('\n📚 Running STANDARD search (raw codes only)...');
      relevantSections = await getRelevantSections(test.question, {
        jurisdiction: test.jurisdiction || 'All California',
      });
      console.log(`   ✅ Found ${relevantSections.length} sections`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: GENERATE ANSWER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n🤖 Generating AI answer...');

    const result: GeneratedAnswer = await generateAnswer(test.question, relevantSections, {
      codeYear: test.code_year,
    });

    console.log(`   ✅ Generated (confidence: ${result.confidence})`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: DISPLAY ANSWER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n📝 AI ANSWER:');
    console.log(`${'-'.repeat(70)}`);
    console.log(result.answer);
    console.log(`${'-'.repeat(70)}`);

    // Display action items
    if (result.actionItems && result.actionItems.length > 0) {
      console.log('\n✅ ACTION ITEMS:');
      result.actionItems.forEach((item: string, i: number) => {
        console.log(`   ${i + 1}. ${item}`);
      });
    }

    // Display inspector tips
    if (result.inspectorTips && result.inspectorTips.length > 0) {
      console.log('\n🔍 INSPECTOR TIPS:');
      result.inspectorTips.forEach((tip: string, i: number) => {
        console.log(`   ${i + 1}. ${tip}`);
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: DISPLAY SOURCES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n📚 SOURCES CITED:');
    if (result.citedSections && result.citedSections.length > 0) {
      result.citedSections.forEach((s: CodeSection) => {
        const year = s.code_year ? ` (${s.code_year})` : '';
        const jurisdiction = s.jurisdiction !== 'All California' ? ` - ${s.jurisdiction}` : '';
        const sourceType = s.source_type === 'enhanced_guide' ? ' 🟢' : ' 🔵';
        console.log(`   ${sourceType} ${s.section_number}${year}${jurisdiction}`);
      });
    } else {
      console.log('   - None');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: VERIFY EXPECTED SECTIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n🔍 SECTION VERIFICATION:');

    const allExpectedSectionsFound = test.expected_sections.every((expected) =>
      result.citedSections?.some((cited: CodeSection) => 
        cited.section_number?.includes(expected)
      )
    );

    if (allExpectedSectionsFound) {
      console.log('   ✅ PASSED - All expected sections cited');
    } else {
      console.log('   ⚠️  PARTIAL - Some expected sections missing');
      console.log(`   Expected: ${test.expected_sections.join(', ')}`);
      console.log(
        `   Found: ${result.citedSections?.map((s: CodeSection) => s.section_number).join(', ') || 'none'}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: VERIFY ENHANCED FEATURES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const enhancedFeaturesFound: string[] = [];
    const enhancedFeaturesMissing: string[] = [];

    if (test.test_enhanced_features) {
      console.log('\n💡 ENHANCED FEATURES VERIFICATION:');

      const answerLower = result.answer?.toLowerCase() || '';

      if (test.test_enhanced_features.should_have_cost) {
        const hasCost =
          answerLower.includes('$') ||
          answerLower.includes('cost') ||
          answerLower.includes('budget') ||
          (result.enhancedMetadata?.costAnalysis &&
            result.enhancedMetadata.costAnalysis.length > 0);

        if (hasCost) {
          console.log('   ✅ Cost information found');
          enhancedFeaturesFound.push('cost');
        } else {
          console.log('   ⚠️  Cost information missing');
          enhancedFeaturesMissing.push('cost');
        }
      }

      if (test.test_enhanced_features.should_have_inspector_tips) {
        const hasInspectorTips =
          (result.inspectorTips && result.inspectorTips.length > 0) ||
          answerLower.includes('inspector') ||
          (result.enhancedMetadata?.inspectorFocus &&
            result.enhancedMetadata.inspectorFocus.length > 0);

        if (hasInspectorTips) {
          console.log('   ✅ Inspector tips found');
          enhancedFeaturesFound.push('inspector_tips');
        } else {
          console.log('   ⚠️  Inspector tips missing');
          enhancedFeaturesMissing.push('inspector_tips');
        }
      }

      if (test.test_enhanced_features.should_have_amendments) {
        const hasAmendments =
          answerLower.includes('amendment') ||
          answerLower.includes('la county') ||
          (result.enhancedMetadata?.jurisdictionAmendments &&
            result.enhancedMetadata.jurisdictionAmendments.length > 0);

        if (hasAmendments) {
          console.log('   ✅ Jurisdiction amendments found');
          enhancedFeaturesFound.push('amendments');
        } else {
          console.log('   ⚠️  Jurisdiction amendments missing');
          enhancedFeaturesMissing.push('amendments');
        }
      }

      if (test.test_enhanced_features.should_have_field_tips) {
        const hasFieldTips =
          answerLower.includes('tip') ||
          answerLower.includes('common') ||
          (result.enhancedMetadata?.fieldTips && result.enhancedMetadata.fieldTips.length > 0);

        if (hasFieldTips) {
          console.log('   ✅ Field tips found');
          enhancedFeaturesFound.push('field_tips');
        } else {
          console.log('   ⚠️  Field tips missing');
          enhancedFeaturesMissing.push('field_tips');
        }
      }

      if (test.test_enhanced_features.should_have_locations) {
        const hasLocations =
          answerLower.includes('garage') ||
          answerLower.includes('kitchen') ||
          answerLower.includes('bathroom') ||
          answerLower.includes('outdoor');

        if (hasLocations) {
          console.log('   ✅ Location context found');
          enhancedFeaturesFound.push('locations');
        } else {
          console.log('   ⚠️  Location context missing');
          enhancedFeaturesMissing.push('locations');
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 7: FINAL VERDICT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const duration = Date.now() - startTime;
    const passed =
      allExpectedSectionsFound &&
      result.confidence !== 'low' &&
      enhancedFeaturesMissing.length === 0;

    console.log('\n' + '='.repeat(70));
    if (passed) {
      console.log('✅ TEST PASSED');
    } else if (allExpectedSectionsFound) {
      console.log('⚠️  TEST PARTIAL - Sections correct, some features missing');
    } else {
      console.log('❌ TEST FAILED - Section verification failed');
    }
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Sections found: ${result.citedSections?.length || 0}`);
    console.log(`   Confidence: ${result.confidence}`);
    if (test.test_enhanced_features) {
      console.log(
        `   Enhanced features: ${enhancedFeaturesFound.length} found, ${enhancedFeaturesMissing.length} missing`
      );
    }
    console.log('='.repeat(70));

    return {
      id: test.id,
      passed,
      sections_found: result.citedSections?.length || 0,
      sections_correct: allExpectedSectionsFound,
      enhanced_features_found: enhancedFeaturesFound,
      enhanced_features_missing: enhancedFeaturesMissing,
      confidence: result.confidence,
      duration,
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH AN ERROR:');
    console.error(error);

    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      id: test.id,
      passed: false,
      sections_found: 0,
      sections_correct: false,
      enhanced_features_found: [],
      enhanced_features_missing: test.test_enhanced_features
        ? Object.keys(test.test_enhanced_features)
        : [],
      confidence: 'low',
      duration,
      error: errorMessage,
    };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(15) + '🚀 AI QUALITY CONTROL TEST v8.0' + ' '.repeat(21) + '║');
  console.log('║' + ' '.repeat(10) + 'RAG Pipeline + Enhanced Features' + ' '.repeat(25) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  console.log(`📋 Running ${testQuestions.length} tests...`);

  const results: TestResult[] = [];

  for (let i = 0; i < testQuestions.length; i++) {
    const test = testQuestions[i];
    console.log(`\n\n📍 TEST ${i + 1}/${testQuestions.length}`);

    const result = await runSingleTest(test);
    results.push(result);

    if (i < testQuestions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FINAL SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('\n\n' + '╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(22) + '📊 FINAL REPORT' + ' '.repeat(31) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const partialTests = results.filter((r) => r.sections_correct && !r.passed).length;
  const failedTests = results.filter((r) => !r.sections_correct).length;
  const errorTests = results.filter((r) => r.error).length;
  const passRateNum = (passedTests / totalTests) * 100;
  const passRate = passRateNum.toFixed(1);

  const avgDuration = (
    results.reduce((sum: number, r: TestResult) => sum + r.duration, 0) / totalTests
  ).toFixed(0);
  const highConfidence = results.filter((r) => r.confidence === 'high').length;
  const mediumConfidence = results.filter((r) => r.confidence === 'medium').length;
  const lowConfidence = results.filter((r) => r.confidence === 'low').length;

  console.log('📈 OVERALL RESULTS:');
  console.log('-'.repeat(70));
  console.log(`   ✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
  console.log(`   ⚠️  Partial: ${partialTests}/${totalTests}`);
  console.log(`   ❌ Failed: ${failedTests}/${totalTests}`);
  if (errorTests > 0) {
    console.log(`   💥 Errors: ${errorTests}/${totalTests}`);
  }
  console.log(`   ⏱️  Avg time: ${avgDuration}ms`);
  console.log('');

  console.log('🎯 CONFIDENCE DISTRIBUTION:');
  console.log('-'.repeat(70));
  console.log(`   🟢 High: ${highConfidence}`);
  console.log(`   🟡 Medium: ${mediumConfidence}`);
  console.log(`   🔴 Low: ${lowConfidence}`);
  console.log('');

  const testsWithEnhanced = results.filter((r) => r.enhanced_features_found.length > 0).length;
  if (testsWithEnhanced > 0) {
    console.log('💡 ENHANCED FEATURES:');
    console.log('-'.repeat(70));
    console.log(`   Tests with enhanced data: ${testsWithEnhanced}/${totalTests}`);

    const allFeaturesFound = results.flatMap((r) => r.enhanced_features_found);
    const uniqueFeatures = [...new Set(allFeaturesFound)];
    console.log(`   Feature types found: ${uniqueFeatures.join(', ') || 'none'}`);
    console.log('');
  }

  if (failedTests > 0 || partialTests > 0 || errorTests > 0) {
    console.log('⚠️  NEEDS ATTENTION:');
    console.log('-'.repeat(70));
    results.forEach((result) => {
      if (!result.passed) {
        const reason = result.error 
          ? `Error: ${result.error}` 
          : !result.sections_correct 
          ? 'Section mismatch' 
          : 'Missing enhanced features';
        
        console.log(`   • ${result.id}: ${reason}`);
        
        if (result.enhanced_features_missing.length > 0) {
          console.log(`     Missing: ${result.enhanced_features_missing.join(', ')}`);
        }
      }
    });
    console.log('');
  }

  console.log('╔' + '═'.repeat(68) + '╗');
  if (passRateNum >= 90) {
    console.log('║' + ' '.repeat(20) + '✨ EXCELLENT! ✨' + ' '.repeat(31) + '║');
  } else if (passRateNum >= 75) {
    console.log('║' + ' '.repeat(22) + '👍 GOOD!' + ' '.repeat(35) + '║');
  } else if (passRateNum >= 50) {
    console.log('║' + ' '.repeat(18) + '⚠️  NEEDS WORK' + ' '.repeat(34) + '║');
  } else {
    console.log('║' + ' '.repeat(15) + '❌ SIGNIFICANT ISSUES' + ' '.repeat(30) + '║');
  }
  console.log('╚' + '═'.repeat(68) + '╝\n');

  console.log('🎉 Quality Control Test Complete.\n');
  
  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// ============================================================================
// RUN TESTS
// ============================================================================

runTests().catch((error) => {
  console.error('💥 Fatal error running tests:', error);
  process.exit(1);
});
