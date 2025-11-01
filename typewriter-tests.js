/**
 * ============================================================================
 * TYPEWRITER ENGINE v2.0 - TEST HARNESS
 * ============================================================================
 * Run this in browser console to verify typewriter behavior
 * 
 * Usage:
 *   1. Open index.html in browser
 *   2. Open DevTools Console (F12)
 *   3. Copy-paste this entire file
 *   4. Run: TypewriterTests.runAll()
 * ============================================================================
 */

const TypewriterTests = {
    results: [],
    
    /**
     * Test 1: Tokenizer handles plain text
     */
    testTokenizer_PlainText() {
        console.log('🧪 Test: Tokenizer - Plain Text');
        const div = document.createElement('div');
        const tw = new TypewriterEngine(div);
        
        const tokens = tw._tokenize('Hello');
        
        if (tokens.length === 5) {
            console.log('✅ PASS: Tokenized "Hello" into 5 characters');
            this.results.push({ test: 'Tokenizer Plain Text', status: 'PASS' });
        } else {
            console.error(`❌ FAIL: Expected 5 tokens, got ${tokens.length}`);
            this.results.push({ test: 'Tokenizer Plain Text', status: 'FAIL' });
        }
        
        tw.destroy();
    },
    
    /**
     * Test 2: Tokenizer preserves HTML
     */
    testTokenizer_HTML() {
        console.log('🧪 Test: Tokenizer - HTML Preservation');
        const div = document.createElement('div');
        const tw = new TypewriterEngine(div);
        
        const tokens = tw._tokenize('Hi<br>There');
        const hasBrTag = tokens.some(t => t.type === 'tag' && t.value.tagName === 'BR');
        
        if (hasBrTag) {
            console.log('✅ PASS: Preserved <br> tag in tokenization');
            this.results.push({ test: 'Tokenizer HTML', status: 'PASS' });
        } else {
            console.error('❌ FAIL: <br> tag not found in tokens');
            this.results.push({ test: 'Tokenizer HTML', status: 'FAIL' });
        }
        
        tw.destroy();
    },
    
    /**
     * Test 3: Tokenizer handles emoji
     */
    testTokenizer_Emoji() {
        console.log('🧪 Test: Tokenizer - Emoji/Surrogate Pairs');
        const div = document.createElement('div');
        const tw = new TypewriterEngine(div);
        
        const tokens = tw._tokenize('👋');
        
        if (tokens.length === 1) {
            console.log('✅ PASS: Emoji treated as single token');
            this.results.push({ test: 'Tokenizer Emoji', status: 'PASS' });
        } else {
            console.error(`❌ FAIL: Expected 1 token for emoji, got ${tokens.length}`);
            this.results.push({ test: 'Tokenizer Emoji', status: 'FAIL' });
        }
        
        tw.destroy();
    },
    
    /**
     * Test 4: State machine transitions
     */
    testStateMachine() {
        console.log('🧪 Test: State Machine Transitions');
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '-9999px';
        document.body.appendChild(div);
        
        const tw = new TypewriterEngine(div, { baseSpeed: 10 });
        
        // Initial state
        if (tw.state !== TypewriterEngine.STATE.IDLE) {
            console.error(`❌ FAIL: Initial state should be IDLE, got ${tw.state}`);
            this.results.push({ test: 'State Machine', status: 'FAIL' });
            tw.destroy();
            document.body.removeChild(div);
            return;
        }
        
        // Start typing
        tw.start('Test');
        if (tw.state !== TypewriterEngine.STATE.TYPING) {
            console.error(`❌ FAIL: After start(), state should be TYPING, got ${tw.state}`);
            this.results.push({ test: 'State Machine', status: 'FAIL' });
            tw.destroy();
            document.body.removeChild(div);
            return;
        }
        
        // Pause
        tw.pause();
        if (tw.state !== TypewriterEngine.STATE.PAUSED) {
            console.error(`❌ FAIL: After pause(), state should be PAUSED, got ${tw.state}`);
            this.results.push({ test: 'State Machine', status: 'FAIL' });
            tw.destroy();
            document.body.removeChild(div);
            return;
        }
        
        // Resume
        tw.resume();
        if (tw.state !== TypewriterEngine.STATE.TYPING) {
            console.error(`❌ FAIL: After resume(), state should be TYPING, got ${tw.state}`);
            this.results.push({ test: 'State Machine', status: 'FAIL' });
            tw.destroy();
            document.body.removeChild(div);
            return;
        }
        
        // Skip
        tw.skip();
        if (tw.state !== TypewriterEngine.STATE.SKIPPED) {
            console.error(`❌ FAIL: After skip(), state should be SKIPPED, got ${tw.state}`);
            this.results.push({ test: 'State Machine', status: 'FAIL' });
            tw.destroy();
            document.body.removeChild(div);
            return;
        }
        
        console.log('✅ PASS: State machine transitions correctly');
        this.results.push({ test: 'State Machine', status: 'PASS' });
        
        tw.destroy();
        document.body.removeChild(div);
    },
    
    /**
     * Test 5: Skip completes instantly
     */
    async testSkip() {
        console.log('🧪 Test: Skip Functionality');
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '-9999px';
        document.body.appendChild(div);
        
        const tw = new TypewriterEngine(div, { baseSpeed: 100 });
        
        let completed = false;
        tw.onComplete(() => {
            completed = true;
        });
        
        tw.start('Long text that would take a while...');
        
        // Skip immediately
        tw.skip();
        
        // Check completion happened instantly
        if (completed && div.textContent === 'Long text that would take a while...') {
            console.log('✅ PASS: Skip completed instantly with full text');
            this.results.push({ test: 'Skip Functionality', status: 'PASS' });
        } else {
            console.error('❌ FAIL: Skip did not complete instantly or text missing');
            this.results.push({ test: 'Skip Functionality', status: 'FAIL' });
        }
        
        tw.destroy();
        document.body.removeChild(div);
    },
    
    /**
     * Test 6: onComplete callback fires
     */
    async testOnComplete() {
        console.log('🧪 Test: onComplete Callback');
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '-9999px';
        document.body.appendChild(div);
        
        return new Promise((resolve) => {
            const tw = new TypewriterEngine(div, { baseSpeed: 10 });
            
            let callbackFired = false;
            tw.onComplete(() => {
                callbackFired = true;
            });
            
            tw.start('Hi');
            
            // Wait for completion (should be ~30ms)
            setTimeout(() => {
                if (callbackFired) {
                    console.log('✅ PASS: onComplete callback fired');
                    this.results.push({ test: 'onComplete Callback', status: 'PASS' });
                } else {
                    console.error('❌ FAIL: onComplete callback did not fire');
                    this.results.push({ test: 'onComplete Callback', status: 'FAIL' });
                }
                
                tw.destroy();
                document.body.removeChild(div);
                resolve();
            }, 100);
        });
    },
    
    /**
     * Test 7: Cleanup prevents memory leaks
     */
    testCleanup() {
        console.log('🧪 Test: Cleanup & Memory Management');
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '-9999px';
        document.body.appendChild(div);
        
        const tw = new TypewriterEngine(div);
        tw.start('Test');
        tw.skip();
        tw.destroy();
        
        // Check all references nullified
        if (tw.element === null && tw.rafId === null && tw.timeoutId === null) {
            console.log('✅ PASS: Cleanup nullified all references');
            this.results.push({ test: 'Cleanup', status: 'PASS' });
        } else {
            console.error('❌ FAIL: Cleanup did not nullify references');
            this.results.push({ test: 'Cleanup', status: 'FAIL' });
        }
        
        document.body.removeChild(div);
    },
    
    /**
     * Test 8: Empty string handling
     */
    testEmptyString() {
        console.log('🧪 Test: Empty String Edge Case');
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '-9999px';
        document.body.appendChild(div);
        
        const tw = new TypewriterEngine(div, { baseSpeed: 10 });
        
        let completed = false;
        tw.onComplete(() => {
            completed = true;
        });
        
        tw.start('');
        
        // Should complete immediately
        setTimeout(() => {
            if (completed) {
                console.log('✅ PASS: Empty string completes immediately');
                this.results.push({ test: 'Empty String', status: 'PASS' });
            } else {
                console.error('❌ FAIL: Empty string did not complete');
                this.results.push({ test: 'Empty String', status: 'FAIL' });
            }
            
            tw.destroy();
            document.body.removeChild(div);
        }, 50);
    },
    
    /**
     * Test 9: Reduced motion detection
     */
    testReducedMotion() {
        console.log('🧪 Test: Reduced Motion Detection');
        const div = document.createElement('div');
        const tw = new TypewriterEngine(div);
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (tw.reducedMotion === prefersReducedMotion) {
            console.log(`✅ PASS: Reduced motion detection correct (${prefersReducedMotion})`);
            this.results.push({ test: 'Reduced Motion', status: 'PASS' });
        } else {
            console.error('❌ FAIL: Reduced motion detection incorrect');
            this.results.push({ test: 'Reduced Motion', status: 'FAIL' });
        }
        
        tw.destroy();
    },
    
    /**
     * Test 10: Rapid start/skip calls (race conditions)
     */
    testRapidCalls() {
        console.log('🧪 Test: Rapid Start/Skip Calls (Race Conditions)');
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '-9999px';
        document.body.appendChild(div);
        
        const tw = new TypewriterEngine(div, { baseSpeed: 50 });
        
        try {
            // Rapid calls
            tw.start('Test 1');
            tw.skip();
            tw.start('Test 2');
            tw.pause();
            tw.resume();
            tw.skip();
            tw.destroy();
            
            console.log('✅ PASS: Rapid calls handled without errors');
            this.results.push({ test: 'Race Conditions', status: 'PASS' });
        } catch (error) {
            console.error('❌ FAIL: Rapid calls caused error:', error);
            this.results.push({ test: 'Race Conditions', status: 'FAIL' });
        }
        
        document.body.removeChild(div);
    },
    
    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.status}`);
        });
        
        console.log('='.repeat(60));
        console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        console.log('='.repeat(60) + '\n');
        
        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED! Typewriter engine is working correctly.');
        } else {
            console.warn(`⚠️ ${failed} test(s) failed. Review errors above.`);
        }
    },
    
    /**
     * Run all tests
     */
    async runAll() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 STARTING TYPEWRITER ENGINE TEST SUITE');
        console.log('='.repeat(60) + '\n');
        
        this.results = [];
        
        // Run tests
        this.testTokenizer_PlainText();
        this.testTokenizer_HTML();
        this.testTokenizer_Emoji();
        this.testStateMachine();
        await this.testSkip();
        await this.testOnComplete();
        this.testCleanup();
        this.testEmptyString();
        this.testReducedMotion();
        this.testRapidCalls();
        
        // Print summary
        this.printSummary();
    }
};

/**
 * ============================================================================
 * VISUAL INTEGRATION TEST
 * ============================================================================
 * Tests the full animation sequence on the actual page
 */

const VisualIntegrationTest = {
    /**
     * Test current page animation
     */
    testPageAnimation() {
        console.log('\n' + '='.repeat(60));
        console.log('🎬 VISUAL INTEGRATION TEST');
        console.log('='.repeat(60) + '\n');
        
        console.log('📋 Manual Verification Checklist:');
        console.log('');
        console.log('  1. Profile Section:');
        console.log('     [ ] Name types character-by-character');
        console.log('     [ ] Blinking cursor visible during typing');
        console.log('     [ ] Bio types after name completes');
        console.log('     [ ] Line breaks preserved (name/bio on separate lines)');
        console.log('');
        console.log('  2. Social Icons:');
        console.log('     [ ] Icons appear one-by-one (staggered)');
        console.log('     [ ] Smooth slide-up animation');
        console.log('');
        console.log('  3. Links Section:');
        console.log('     [ ] Each link slides in sequentially');
        console.log('     [ ] Link titles type out');
        console.log('     [ ] Descriptions type after titles');
        console.log('     [ ] Random glitch effects appear');
        console.log('');
        console.log('  4. Footer:');
        console.log('     [ ] Footer text types with cursor');
        console.log('     [ ] Cursor disappears when done');
        console.log('');
        console.log('  5. Performance:');
        console.log('     [ ] Smooth 60 FPS throughout');
        console.log('     [ ] No layout shifts or jumps');
        console.log('     [ ] No console errors');
        console.log('');
        console.log('='.repeat(60));
        console.log('💡 TIP: Open DevTools Performance tab and record during animation');
        console.log('='.repeat(60) + '\n');
    },
    
    /**
     * Measure timing of actual animation
     */
    measureTiming() {
        console.log('\n⏱️  TIMING MEASUREMENT');
        console.log('Reload page and click entry screen to measure...\n');
        
        const startTime = performance.now();
        
        // Listen for completion
        const checkCompletion = setInterval(() => {
            const footer = document.querySelector('.footer');
            if (footer && footer.classList.contains('tw-visible')) {
                const endTime = performance.now();
                const duration = ((endTime - startTime) / 1000).toFixed(2);
                
                console.log(`✅ Animation completed in ${duration} seconds`);
                console.log(`   Expected: ~8-10 seconds`);
                
                if (duration >= 7 && duration <= 12) {
                    console.log('   ✅ Within expected range');
                } else {
                    console.warn('   ⚠️  Outside expected range - check configuration');
                }
                
                clearInterval(checkCompletion);
            }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
            clearInterval(checkCompletion);
            console.log('   ⏳ Measurement timed out after 30s');
        }, 30000);
    }
};

/**
 * ============================================================================
 * USAGE INSTRUCTIONS
 * ============================================================================
 * 
 * Open browser console (F12) and run:
 * 
 * // Run all automated tests
 * TypewriterTests.runAll()
 * 
 * // Run visual integration test checklist
 * VisualIntegrationTest.testPageAnimation()
 * 
 * // Measure animation timing
 * VisualIntegrationTest.measureTiming()
 * 
 * ============================================================================
 */

console.log('✅ Typewriter Test Harness Loaded');
console.log('📝 Run: TypewriterTests.runAll()');
console.log('🎬 Run: VisualIntegrationTest.testPageAnimation()');
console.log('⏱️  Run: VisualIntegrationTest.measureTiming()');
