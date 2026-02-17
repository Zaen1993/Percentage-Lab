// adaptive-learning.js
const AdaptiveLearning = {
    studentProfiles: {},
    
    init() {
        this.loadProfiles();
        this.setupAdaptiveEngine();
    },
    
    loadProfiles() {
        const saved = localStorage.getItem('adaptive_profiles');
        if (saved) {
            this.studentProfiles = JSON.parse(saved);
        }
    },
    
    saveProfiles() {
        localStorage.setItem('adaptive_profiles', JSON.stringify(this.studentProfiles));
    },
    
    getStudentProfile(studentId) {
        if (!this.studentProfiles[studentId]) {
            this.studentProfiles[studentId] = {
                id: studentId,
                level: 1,
                knowledge: {
                    basics: 0.5,
                    fractions: 0.3,
                    percentages: 0.4,
                    wordProblems: 0.2
                },
                performance: {
                    accuracy: 0,
                    speed: 'medium',
                    consistency: 0,
                    attempts: 0,
                    successes: 0
                },
                preferences: {
                    mode: 'visual',
                    difficulty: 'adaptive',
                    hints: true
                },
                history: [],
                lastActive: Date.now()
            };
        }
        return this.studentProfiles[studentId];
    },
    
    updateProfile(studentId, exerciseResult) {
        const profile = this.getStudentProfile(studentId);
        
        profile.performance.attempts++;
        if (exerciseResult.score > 70) {
            profile.performance.successes++;
        }
        
        profile.performance.accuracy = 
            profile.performance.successes / profile.performance.attempts;
        
        profile.performance.speed = this.calculateSpeed(
            exerciseResult.timeSpent,
            exerciseResult.totalQuestions
        );
        
        profile.history.push({
            timestamp: Date.now(),
            exercise: exerciseResult.exerciseId,
            score: exerciseResult.score,
            time: exerciseResult.timeSpent,
            details: exerciseResult.details
        });
        
        if (profile.history.length > 50) {
            profile.history = profile.history.slice(-50);
        }
        
        this.updateKnowledge(profile, exerciseResult);
        this.updateLevel(profile);
        this.saveProfiles();
        
        return profile;
    },
    
    calculateSpeed(timeSpent, questions) {
        const avgTimePerQuestion = timeSpent / questions;
        
        if (avgTimePerQuestion < 10) return 'fast';
        if (avgTimePerQuestion < 20) return 'medium';
        return 'slow';
    },
    
    updateKnowledge(profile, result) {
        const knowledgeAreas = {
            'basics': ['تمرين-المجسمات-ثلاثية-الأبعاد', 'basic-grid'],
            'fractions': ['حساب-النسبة-المئوية', 'fraction-conversion'],
            'percentages': ['تحدي-الأشكال', 'percentage-calc'],
            'wordProblems': ['word-problems', 'real-world']
        };
        
        Object.entries(knowledgeAreas).forEach(([area, exercises]) => {
            if (exercises.includes(result.exerciseId)) {
                const improvement = result.score / 100 * 0.1;
                profile.knowledge[area] = Math.min(1, 
                    profile.knowledge[area] + improvement
                );
            }
        });
    },
    
    updateLevel(profile) {
        const totalKnowledge = Object.values(profile.knowledge).reduce((a, b) => a + b, 0);
        const avgKnowledge = totalKnowledge / Object.keys(profile.knowledge).length;
        
        if (avgKnowledge > 0.8 && profile.performance.accuracy > 0.85) {
            profile.level = 3; // متقدم
        } else if (avgKnowledge > 0.5 && profile.performance.accuracy > 0.7) {
            profile.level = 2; // متوسط
        } else {
            profile.level = 1; // مبتدئ
        }
    },
    
    recommendExercise(studentId) {
        const profile = this.getStudentProfile(studentId);
        
        const weakestArea = Object.entries(profile.knowledge)
            .sort((a, b) => a[1] - b[1])[0][0];
        
        const recommendations = {
            basics: { exercise: 'تمرين-المجسمات-ثلاثية-الأبعاد', difficulty: 'easy', focus: 'الأساسيات' },
            fractions: { exercise: 'حساب-النسبة-المئوية', difficulty: 'medium', focus: 'الكسور' },
            percentages: { exercise: 'تحدي-الأشكال', difficulty: 'hard', focus: 'النسب المئوية' },
            wordProblems: { exercise: 'real-world', difficulty: 'medium', focus: 'مسائل واقعية' }
        };
        
        let recommendation = recommendations[weakestArea];
        
        if (profile.level === 1) {
            recommendation.difficulty = 'easy';
        } else if (profile.level === 3) {
            recommendation.difficulty = 'hard';
        }
        
        if (profile.performance.speed === 'slow') {
            recommendation.timeLimit = null;
        } else {
            recommendation.timeLimit = this.calculateTimeLimit(profile.level);
        }
        
        return {
            ...recommendation,
            reason: `تحسين مهارة ${recommendation.focus}`,
            confidence: (1 - profile.knowledge[weakestArea]).toFixed(2),
            estimatedTime: this.estimateTime(profile)
        };
    },
    
    calculateTimeLimit(level) {
        switch(level) {
            case 1: return 600;
            case 2: return 420;
            case 3: return 300;
            default: return 480;
        }
    },
    
    estimateTime(profile) {
        const baseTime = 300;
        const speedFactor = profile.performance.speed === 'fast' ? 0.7 : 
                          profile.performance.speed === 'slow' ? 1.3 : 1;
        
        return Math.round(baseTime * speedFactor);
    },
    
    generateStudentReport(studentId) {
        const profile = this.getStudentProfile(studentId);
        
        return {
            studentId,
            level: profile.level,
            strengths: this.findStrengths(profile),
            weaknesses: this.findWeaknesses(profile),
            recommendations: this.generateRecommendations(profile),
            progress: this.calculateProgress(profile),
            nextSteps: this.suggestNextSteps(profile)
        };
    },
    
    findStrengths(profile) {
        return Object.entries(profile.knowledge)
            .filter(([area, value]) => value > 0.7)
            .map(([area]) => area);
    },
    
    findWeaknesses(profile) {
        return Object.entries(profile.knowledge)
            .filter(([area, value]) => value < 0.4)
            .map(([area]) => area);
    },
    
    generateRecommendations(profile) {
        const weaknesses = this.findWeaknesses(profile);
        return weaknesses.map(weakness => ({
            area: weakness,
            action: `تدريب إضافي على ${weakness}`,
            resources: this.getResourcesForArea(weakness),
            target: `رفع المهارة إلى 70%`
        }));
    },
    
    getResourcesForArea(area) {
        const resources = {
            basics: ['تمرين-المجسمات-ثلاثية-الأبعاد.html', 'video-basics.mp4', 'quiz-basics.html'],
            fractions: ['حساب-النسبة-المئوية.html', 'fraction-chart.png', 'practice-fractions.html'],
            percentages: ['تحدي-الأشكال.html', 'percentage-calculator.html', 'real-examples.html'],
            wordProblems: ['word-problems.html', 'step-by-step-guide.pdf']
        };
        return resources[area] || [];
    },
    
    calculateProgress(profile) {
        const recentHistory = profile.history.slice(-10);
        if (recentHistory.length < 2) return 0;
        
        const firstScore = recentHistory[0].score;
        const lastScore = recentHistory[recentHistory.length - 1].score;
        
        return ((lastScore - firstScore) / firstScore) * 100;
    },
    
    suggestNextSteps(profile) {
        const steps = [];
        
        if (profile.performance.accuracy < 0.7) {
            steps.push('مراجعة الأساسيات قبل التقدم');
        }
        
        if (profile.performance.speed === 'slow') {
            steps.push('تمارين التركيز على السرعة');
        }
        
        if (profile.level === 1 && Object.values(profile.knowledge).some(k => k > 0.6)) {
            steps.push('جاهز للانتقال للمستوى المتوسط');
        }
        
        return steps;
    },
    
    setupAdaptiveEngine() {
        setInterval(() => {
            this.cleanOldProfiles();
        }, 86400000);
    },
    
    cleanOldProfiles() {
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        Object.keys(this.studentProfiles).forEach(studentId => {
            if (this.studentProfiles[studentId].lastActive < oneMonthAgo) {
                delete this.studentProfiles[studentId];
            }
        });
        
        this.saveProfiles();
    }
};

export default AdaptiveLearning;