import {
  BonusCourseDef,
  CompetencyAreaDef,
  CompletionCriteriaDef,
  OfficialCourseDef,
} from '../types';

export const DATAMITES_PROGRAM_FACTS = {
  bundleCode: 'CDM-AIE-BUN-071',
  brochureVersion: 'DataMites AI Engineer Program Brochure · 2026 Q4',
  durationMonths: 8,
  trainingMonths: 5,
  internshipMonths: 3,
  preCoursePrepWeeks: 2,
  totalLearningHours: 440,
  liveTrainingHours: 160,
  coreCurriculumLiveHours: 152,
  revisionWeekLiveHours: 8,
  liveProjectMentoringHours: 40,
  weeklyCommitment: {
    liveTraining: 8,
    selfLearningAndRevision: 8,
    assignmentsAndProjects: 4,
    total: 20,
  },
  minimumOfficialProjects: 5,
  bonusLearningHours: 65,
  bonusLiveHours: 26,
};

export const OFFICIAL_CURRICULUM: OfficialCourseDef[] = [
  {
    id: 'course-01',
    order: 1,
    courseCode: 'CDM-DSF-112',
    title: 'Data Science Foundation',
    weeks: [1],
    weekLabel: 'Week 1',
    liveHours: 8,
    tools: ['Analytics Frameworks', 'Project Lifecycle'],
    brochurePage: 9,
    modules: [
      {
        id: 'w1-m1',
        moduleNumber: 1,
        title: 'Data Science and Business Decisions',
        hours: 2,
        week: 1,
        subtopics: [
          {
            id: 'w1-m1-t1',
            title: 'Data science, analytics, machine learning, and their relationship to AI',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m1-t2',
            title: 'Descriptive, diagnostic, predictive, and prescriptive analytics',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m1-t3',
            title: 'Business questions, stakeholders, success metrics, and practical constraints',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w1-m2',
        moduleNumber: 2,
        title: 'Data and the Project Lifecycle',
        hours: 2,
        week: 1,
        subtopics: [
          {
            id: 'w1-m2-t1',
            title: 'Structured, semi-structured, and unstructured data',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m2-t2',
            title: 'Problem definition, collection, preparation, modelling, evaluation, and delivery',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m2-t3',
            title: 'Data quality, privacy, consent, and leakage awareness',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w1-m3',
        moduleNumber: 3,
        title: 'Modelling and Evaluation Overview',
        hours: 2,
        week: 1,
        subtopics: [
          {
            id: 'w1-m3-t1',
            title: 'Supervised versus unsupervised learning; regression, classification, and clustering',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m3-t2',
            title: 'Baselines, training and test data, and interpreting model performance',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m3-t3',
            title: 'Recognising when rules, analytics, or ML are appropriate',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w1-m4',
        moduleNumber: 4,
        title: 'Industry Applications and Guided Case Study',
        hours: 2,
        week: 1,
        subtopics: [
          {
            id: 'w1-m4-t1',
            title: 'A guided data-to-business-decision demonstration',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m4-t2',
            title: 'Data scientist, analyst, data engineer, ML engineer, and AI engineer responsibilities',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w1-m4-t3',
            title: 'Reporting results, limitations, and expected business value',
            week: 1,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-02',
    order: 2,
    courseCode: 'CDM-PYF-110',
    title: 'Python Foundation',
    weeks: [2, 3],
    weekLabel: 'Weeks 2–3',
    liveHours: 16,
    tools: ['Python', 'Notebooks', 'Virtual environments', 'REST APIs'],
    brochurePage: 10,
    modules: [
      {
        id: 'w2-m1',
        moduleNumber: 1,
        title: 'Python Environment and Core Syntax',
        hours: 4,
        week: 2,
        subtopics: [
          {
            id: 'w2-m1-t1',
            title: 'Python, notebooks, editor setup, and virtual environments',
            week: 2,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w2-m1-t2',
            title: 'Variables, basic types, operators, strings, and conversions',
            week: 2,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w2-m1-t3',
            title: 'Conditions, loops, and basic debugging',
            week: 2,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w2-m2',
        moduleNumber: 2,
        title: 'Data Structures and Functions',
        hours: 4,
        week: 2,
        subtopics: [
          {
            id: 'w2-m2-t1',
            title: 'Lists, tuples, sets, dictionaries, and comprehensions',
            week: 2,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w2-m2-t2',
            title: 'Functions, parameters, return values, and scope',
            week: 2,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w2-m2-t3',
            title: 'Writing readable, reusable functions and handling edge cases',
            week: 2,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w3-m3',
        moduleNumber: 3,
        title: 'Reliable Python Programs',
        hours: 4,
        week: 3,
        subtopics: [
          {
            id: 'w3-m3-t1',
            title: 'File handling, CSV, JSON, and exception handling',
            week: 3,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w3-m3-t2',
            title: 'Modules, packages, dependency management, and introductory classes',
            week: 3,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w3-m3-t3',
            title: 'Type hints, assertions, basic tests, and logging',
            week: 3,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w3-m4',
        moduleNumber: 4,
        title: 'Python for Connected Applications',
        hours: 4,
        week: 3,
        subtopics: [
          {
            id: 'w3-m4-t1',
            title: 'HTTP requests, REST API consumption, and response parsing',
            week: 3,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w3-m4-t2',
            title: 'Environment variables, safe credential handling, and error responses',
            week: 3,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w3-m4-t3',
            title: 'AI-assisted coding: task specifications, generated-code review, tests, and debugging',
            week: 3,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-03',
    order: 3,
    courseCode: 'CDM-STA-139',
    title: 'Statistics Essentials',
    weeks: [4],
    weekLabel: 'Week 4',
    liveHours: 8,
    tools: ['Descriptive Stats', 'Probability', 'Hypothesis Testing', 'Linear Algebra'],
    brochurePage: 11,
    modules: [
      {
        id: 'w4-m1',
        moduleNumber: 1,
        title: 'Descriptive Statistics and Data Behaviour',
        hours: 2,
        week: 4,
        subtopics: [
          {
            id: 'w4-m1-t1',
            title: 'Data types, central tendency, dispersion, percentiles, and outliers',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m1-t2',
            title: 'Distribution shape, normal distribution, and visual interpretation',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m1-t3',
            title: 'Correlation, covariance, and correlation versus causation',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w4-m2',
        moduleNumber: 2,
        title: 'Probability and Sampling',
        hours: 2,
        week: 4,
        subtopics: [
          {
            id: 'w4-m2-t1',
            title: "Probability, conditional probability, and Bayes' theorem intuitively",
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m2-t2',
            title: 'Random variables and common distributions',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m2-t3',
            title: 'Representative sampling, sampling bias, and uncertainty',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w4-m3',
        moduleNumber: 3,
        title: 'Statistical Inference and Experiments',
        hours: 2,
        week: 4,
        subtopics: [
          {
            id: 'w4-m3-t1',
            title: 'Confidence intervals, effect size, and hypothesis testing',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m3-t2',
            title: 'P-values, Type I/II errors, and basic test selection',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m3-t3',
            title: 'A/B test interpretation and common mistakes',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w4-m4',
        moduleNumber: 4,
        title: 'Essential Mathematics for ML',
        hours: 2,
        week: 4,
        subtopics: [
          {
            id: 'w4-m4-t1',
            title: 'Vectors, matrices, dot products, distances, and similarity',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m4-t2',
            title: 'Derivatives and gradient descent through visual examples',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w4-m4-t3',
            title: 'Applying statistical interpretation to a small business dataset',
            week: 4,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-04',
    order: 4,
    courseCode: 'CDM-MLA-130',
    title: 'Machine Learning Associate',
    weeks: [5, 6],
    weekLabel: 'Weeks 5–6',
    liveHours: 16,
    tools: ['NumPy', 'pandas', 'Matplotlib', 'Seaborn', 'scikit-learn'],
    brochurePage: 12,
    modules: [
      {
        id: 'w5-m1',
        moduleNumber: 1,
        title: 'Data Analysis with Python',
        hours: 4,
        week: 5,
        subtopics: [
          {
            id: 'w5-m1-t1',
            title: 'NumPy arrays, vectorised operations, and broadcasting basics',
            week: 5,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w5-m1-t2',
            title: 'pandas dataframes: loading, filtering, grouping, and joining data',
            week: 5,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w5-m1-t3',
            title: 'Missing values, duplicates, data types, and introductory EDA',
            week: 5,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w5-m2',
        moduleNumber: 2,
        title: 'Visualisation and Modelling Workflow',
        hours: 4,
        week: 5,
        subtopics: [
          {
            id: 'w5-m2-t1',
            title: 'Matplotlib/Seaborn plots for distributions, relationships, and errors',
            week: 5,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w5-m2-t2',
            title: 'Train/validation/test splits, preprocessing, and leakage prevention',
            week: 5,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w5-m2-t3',
            title: 'scikit-learn pipelines and simple baselines',
            week: 5,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w6-m3',
        moduleNumber: 3,
        title: 'Supervised Learning',
        hours: 4,
        week: 6,
        subtopics: [
          {
            id: 'w6-m3-t1',
            title: 'Linear and logistic regression',
            week: 6,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w6-m3-t2',
            title: 'K-nearest neighbours and a decision-tree baseline',
            week: 6,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w6-m3-t3',
            title: 'MAE/RMSE, precision, recall, F1, and confusion matrices',
            week: 6,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w6-m4',
        moduleNumber: 4,
        title: 'Unsupervised Learning and Model Comparison',
        hours: 4,
        week: 6,
        subtopics: [
          {
            id: 'w6-m4-t1',
            title: 'K-means and clustering interpretation',
            week: 6,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w6-m4-t2',
            title: 'Scaling, introductory dimensionality reduction, and clustering evaluation',
            week: 6,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w6-m4-t3',
            title: 'Cross-validation, overfitting, and selecting models for a business objective',
            week: 6,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-05',
    order: 5,
    courseCode: 'CDM-MLE-113',
    title: 'Machine Learning Expert',
    weeks: [7, 8],
    weekLabel: 'Weeks 7–8',
    liveHours: 16,
    tools: ['scikit-learn', 'XGBoost', 'LightGBM', 'CatBoost', 'SHAP'],
    brochurePage: 13,
    modules: [
      {
        id: 'w7-m1',
        moduleNumber: 1,
        title: 'Feature Engineering and Robust Pipelines',
        hours: 4,
        week: 7,
        subtopics: [
          {
            id: 'w7-m1-t1',
            title: 'Imputation, categorical encoding, scaling, and transformations',
            week: 7,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w7-m1-t2',
            title: 'Feature selection, PCA, and handling high-dimensional data',
            week: 7,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w7-m1-t3',
            title: 'Preventing leakage during cross-validation and preprocessing',
            week: 7,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w7-m2',
        moduleNumber: 2,
        title: 'Ensembles and Gradient Boosting',
        hours: 4,
        week: 7,
        subtopics: [
          {
            id: 'w7-m2-t1',
            title: 'Bagging and random forests',
            week: 7,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w7-m2-t2',
            title: 'Gradient boosting and hands-on XGBoost',
            week: 7,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w7-m2-t3',
            title: 'LightGBM/CatBoost comparison and model-selection tradeoffs',
            week: 7,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w8-m3',
        moduleNumber: 3,
        title: 'Tuning and Decision Quality',
        hours: 4,
        week: 8,
        subtopics: [
          {
            id: 'w8-m3-t1',
            title: 'Random search and introductory Bayesian optimisation',
            week: 8,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w8-m3-t2',
            title: 'Imbalanced classification, class weights, and resampling within training folds',
            week: 8,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w8-m3-t3',
            title: 'Threshold selection, probability calibration, and business error costs',
            week: 8,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w8-m4',
        moduleNumber: 4,
        title: 'Explainability and Reliable Evaluation',
        hours: 4,
        week: 8,
        subtopics: [
          {
            id: 'w8-m4-t1',
            title: 'Feature importance, SHAP interpretation, and its limitations',
            week: 8,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w8-m4-t2',
            title: 'Error analysis, subgroup performance, and robustness checks',
            week: 8,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w8-m4-t3',
            title: 'Reproducible experiment comparison and model selection reports',
            week: 8,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-06',
    order: 6,
    courseCode: 'CDM-ADS-114',
    title: 'Advanced Data Science',
    weeks: [9],
    weekLabel: 'Week 9',
    liveHours: 8,
    tools: ['ARIMA / SARIMA', 'FastAPI', 'Experiment tracking'],
    brochurePage: 14,
    modules: [
      {
        id: 'w9-m1',
        moduleNumber: 1,
        title: 'Forecasting and Temporal Validation',
        hours: 2,
        week: 9,
        subtopics: [
          {
            id: 'w9-m1-t1',
            title: 'Trend, seasonality, seasonal-naive baselines, and ARIMA/SARIMA concepts',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m1-t2',
            title: 'Walk-forward validation, forecast errors, and prediction intervals',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m1-t3',
            title: 'Guided comparison of baseline and statistical forecasting approaches',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w9-m2',
        moduleNumber: 2,
        title: 'Applied Data Science Extensions',
        hours: 2,
        week: 9,
        subtopics: [
          {
            id: 'w9-m2-t1',
            title: 'Anomaly detection with a representative implementation',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m2-t2',
            title: 'Recommendation-system concepts and evaluation overview',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m2-t3',
            title: 'Business impact, uncertainty, and communicating model limitations',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w9-m3',
        moduleNumber: 3,
        title: 'Delivering an ML Model',
        hours: 2,
        week: 9,
        subtopics: [
          {
            id: 'w9-m3-t1',
            title: 'Saving a preprocessing/model pipeline and recording dependencies',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m3-t2',
            title: 'A guided FastAPI prediction endpoint with input validation',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m3-t3',
            title: 'API testing, failure responses, and a simple application demonstration',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w9-m4',
        moduleNumber: 4,
        title: 'AI Essentials and Lifecycle Decisions',
        hours: 2,
        week: 9,
        subtopics: [
          {
            id: 'w9-m4-t1',
            title: 'Deep learning, LLMs, RAG, and agents: capabilities and limitations',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m4-t2',
            title: 'When predictive ML, retrieval, or an agent is appropriate',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w9-m4-t3',
            title: 'Experiment tracking, drift awareness, and an operational handover checklist',
            week: 9,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-07',
    order: 7,
    courseCode: 'CDM-DBM-120',
    title: 'Database: SQL and MongoDB',
    weeks: [10],
    weekLabel: 'Week 10',
    liveHours: 8,
    tools: ['PostgreSQL', 'MongoDB', 'Python'],
    brochurePage: 15,
    modules: [
      {
        id: 'w10-m1',
        moduleNumber: 1,
        title: 'Relational Databases and SQL Basics',
        hours: 2,
        week: 10,
        subtopics: [
          {
            id: 'w10-m1-t1',
            title: 'Tables, types, keys, constraints, and relationships',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m1-t2',
            title: 'SELECT, filtering, ordering, aggregation, GROUP BY, and HAVING',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m1-t3',
            title: 'PostgreSQL as the primary relational teaching environment',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w10-m2',
        moduleNumber: 2,
        title: 'Analytical SQL',
        hours: 2,
        week: 10,
        subtopics: [
          {
            id: 'w10-m2-t1',
            title: 'Joins, subqueries, and common table expressions',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m2-t2',
            title: 'Window functions for ranking, running totals, and grouped comparisons',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m2-t3',
            title: 'Query correctness and introductory index/performance concepts',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w10-m3',
        moduleNumber: 3,
        title: 'MongoDB and Document Data',
        hours: 2,
        week: 10,
        subtopics: [
          {
            id: 'w10-m3-t1',
            title: 'Relational versus document storage and appropriate use cases',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m3-t2',
            title: 'MongoDB documents, collections, CRUD, filtering, and aggregation basics',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m3-t3',
            title: 'JSON structures and metadata for AI applications',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w10-m4',
        moduleNumber: 4,
        title: 'Database Integration for AI',
        hours: 2,
        week: 10,
        subtopics: [
          {
            id: 'w10-m4-t1',
            title: 'Reading and writing data using Python and parameterised queries',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m4-t2',
            title: 'Data validation, credentials, permissions, and access boundaries',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w10-m4-t3',
            title: 'Vector storage and similarity-search concepts',
            week: 10,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-08',
    order: 8,
    courseCode: 'CDM-GIT-115',
    title: 'Version Control with Git',
    weeks: [11],
    weekLabel: 'Week 11',
    liveHours: 8,
    tools: ['Git', 'GitHub', 'GitHub Actions'],
    brochurePage: 16,
    modules: [
      {
        id: 'w11-m1',
        moduleNumber: 1,
        title: 'Repositories and Reproducibility',
        hours: 2,
        week: 11,
        subtopics: [
          {
            id: 'w11-m1-t1',
            title: 'Git concepts, local/remote repositories, clone, init, and status',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m1-t2',
            title: 'Staging, commits, history, and useful commit messages',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m1-t3',
            title: '.gitignore, dependency files, and keeping secrets/data out of repositories',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w11-m2',
        moduleNumber: 2,
        title: 'Branching and Collaboration',
        hours: 2,
        week: 11,
        subtopics: [
          {
            id: 'w11-m2-t1',
            title: 'Branches, merges, pull requests, and code review',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m2-t2',
            title: 'Push, pull, fetch, and resolving conflicts',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m2-t3',
            title: 'Issues and team task tracking in GitHub',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w11-m3',
        moduleNumber: 3,
        title: 'Safe Change Management',
        hours: 2,
        week: 11,
        subtopics: [
          {
            id: 'w11-m3-t1',
            title: 'Revert versus reset and safe handling of shared history',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m3-t2',
            title: 'Tags, releases, and documenting experiments',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m3-t3',
            title: 'Reviewing AI-generated code before committing',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w11-m4',
        moduleNumber: 4,
        title: 'Automated Quality Checks',
        hours: 2,
        week: 11,
        subtopics: [
          {
            id: 'w11-m4-t1',
            title: 'Basic Python tests and linting',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m4-t2',
            title: 'A small GitHub Actions workflow to run checks',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w11-m4-t3',
            title: 'README structure, reproducible setup, and release handover',
            week: 11,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-09',
    order: 9,
    courseCode: 'CDM-BDF-117',
    title: 'Big Data Foundation',
    weeks: [12],
    weekLabel: 'Week 12',
    liveHours: 8,
    tools: ['PySpark', 'Spark SQL', 'Parquet'],
    brochurePage: 17,
    modules: [
      {
        id: 'w12-m1',
        moduleNumber: 1,
        title: 'Scalable Data Foundations',
        hours: 2,
        week: 12,
        subtopics: [
          {
            id: 'w12-m1-t1',
            title: 'Data volume, velocity, variety, and quality considerations',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m1-t2',
            title: 'Batch versus streaming and single-machine versus distributed processing',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m1-t3',
            title: 'Object storage, partitioning, and columnar formats such as Parquet',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w12-m2',
        moduleNumber: 2,
        title: 'Practical AI Data Pipelines',
        hours: 2,
        week: 12,
        subtopics: [
          {
            id: 'w12-m2-t1',
            title: 'Ingestion from files, APIs, and databases',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m2-t2',
            title: 'Schema checks, duplicates, missing data, and reproducible transformations',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m2-t3',
            title: 'Incremental updates and pipeline failure handling',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w12-m3',
        moduleNumber: 3,
        title: 'Spark DataFrames and Spark SQL',
        hours: 2,
        week: 12,
        subtopics: [
          {
            id: 'w12-m3-t1',
            title: 'Local PySpark setup or a supplied training environment',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m3-t2',
            title: 'DataFrames, filtering, joins, aggregation, and Spark SQL',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m3-t3',
            title: 'Partitioning and execution concepts through a guided example',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w12-m4',
        moduleNumber: 4,
        title: 'Data Pipelines for AI Applications',
        hours: 2,
        week: 12,
        subtopics: [
          {
            id: 'w12-m4-t1',
            title: 'Document ingestion, metadata, and dataset lineage',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m4-t2',
            title: 'Data access controls and sensitive-information handling',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w12-m4-t3',
            title: 'Preparing governed datasets for ML and retrieval applications',
            week: 12,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-10',
    order: 10,
    courseCode: 'CDM-BIA-119',
    title: 'Certified Business Intelligence (BI) Analyst',
    weeks: [13],
    weekLabel: 'Week 13',
    liveHours: 8,
    tools: ['Power BI', 'Power Query', 'DAX', 'Tableau (comparison)'],
    brochurePage: 18,
    modules: [
      {
        id: 'w13-m1',
        moduleNumber: 1,
        title: 'Business Metrics and Data Preparation',
        hours: 2,
        week: 13,
        subtopics: [
          {
            id: 'w13-m1-t1',
            title: 'Business questions, KPI definitions, and consistent metric calculation',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m1-t2',
            title: 'Power Query transformations and combining sources',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m1-t3',
            title: 'Data quality and misleading comparisons',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w13-m2',
        moduleNumber: 2,
        title: 'Data Modelling and Calculations',
        hours: 2,
        week: 13,
        subtopics: [
          {
            id: 'w13-m2-t1',
            title: 'Relationships, star-schema intuition, and date dimensions',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m2-t2',
            title: 'Measures versus calculated columns and essential DAX',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m2-t3',
            title: 'Connecting to prepared SQL/CSV data',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w13-m3',
        moduleNumber: 3,
        title: 'Dashboard Design and Interpretation',
        hours: 2,
        week: 13,
        subtopics: [
          {
            id: 'w13-m3-t1',
            title: 'Appropriate charts, filters, drill-down, and accessible presentation',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m3-t2',
            title: 'Dashboard storytelling and interpreting uncertainty',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m3-t3',
            title: 'Power BI as the primary hands-on tool; Tableau comparison only',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w13-m4',
        moduleNumber: 4,
        title: 'Measuring AI and Business Outcomes',
        hours: 2,
        week: 13,
        subtopics: [
          {
            id: 'w13-m4-t1',
            title: 'Model/AI-service quality, adoption, latency, and cost metrics',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m4-t2',
            title: 'Relating technical metrics to business outcomes',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w13-m4-t3',
            title: 'A guided dashboard, access considerations, and stakeholder presentation',
            week: 13,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-11',
    order: 11,
    courseCode: 'CDM-AIF-128',
    title: 'AI Foundation',
    weeks: [14],
    weekLabel: 'Week 14',
    liveHours: 8,
    tools: ['AI Architecture', 'SDKs', 'Responsible AI', 'System Design'],
    brochurePage: 19,
    modules: [
      {
        id: 'w14-m1',
        moduleNumber: 1,
        title: 'AI Architectures and Solution Selection',
        hours: 2,
        week: 14,
        subtopics: [
          {
            id: 'w14-m1-t1',
            title: 'Predictive ML, deep learning, foundation models, and agents',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m1-t2',
            title: 'Rules versus ML versus LLM applications: practical tradeoffs',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m1-t3',
            title: 'Build, adapt, or integrate; quality, latency, cost, and privacy constraints',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w14-m2',
        moduleNumber: 2,
        title: 'AI Application Architecture',
        hours: 2,
        week: 14,
        subtopics: [
          {
            id: 'w14-m2-t1',
            title: 'Models, data sources, APIs, retrieval, tools, and application interfaces',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m2-t2',
            title: 'Hosted versus open-weight models and deployment choices',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m2-t3',
            title: 'Scope, acceptance criteria, and measurable business outcomes',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w14-m3',
        moduleNumber: 3,
        title: 'Evaluation, Security, and Responsible AI',
        hours: 2,
        week: 14,
        subtopics: [
          {
            id: 'w14-m3-t1',
            title: 'Baselines, held-out evaluation, uncertainty, bias, and failure analysis',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m3-t2',
            title: 'Prompt injection, data leakage, permission boundaries, and human approvals',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m3-t3',
            title: 'Model/data licensing, sensitive data, and governance principles',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w14-m4',
        moduleNumber: 4,
        title: 'Engineering Setup and Guided System Design',
        hours: 2,
        week: 14,
        subtopics: [
          {
            id: 'w14-m4-t1',
            title: 'Python project environment, SDKs, API keys, and dependency checks',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m4-t2',
            title: 'Requirements discovery and a simple AI architecture exercise',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w14-m4-t3',
            title: 'Model selection, test cases, risk controls, and an implementation plan',
            week: 14,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-12',
    order: 12,
    courseCode: 'CDM-AIA-129',
    title: 'Artificial Intelligence Associate',
    weeks: [15],
    weekLabel: 'Week 15',
    liveHours: 8,
    tools: ['PyTorch', 'CPU / GPU training'],
    brochurePage: 20,
    modules: [
      {
        id: 'w15-m1',
        moduleNumber: 1,
        title: 'Neural Network Principles',
        hours: 2,
        week: 15,
        subtopics: [
          {
            id: 'w15-m1-t1',
            title: 'Layers, activations, losses, forward propagation, and backpropagation intuition',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m1-t2',
            title: 'Optimisers, learning rates, and gradient-based learning',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m1-t3',
            title: 'Underfitting, overfitting, and regularisation',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w15-m2',
        moduleNumber: 2,
        title: 'PyTorch Fundamentals',
        hours: 2,
        week: 15,
        subtopics: [
          {
            id: 'w15-m2-t1',
            title: 'Tensors, automatic differentiation, datasets, and data loaders',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m2-t2',
            title: 'A compact training and validation loop',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m2-t3',
            title: 'CPU/GPU use, reproducibility, and checkpoints',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w15-m3',
        moduleNumber: 3,
        title: 'Improving and Adapting Models',
        hours: 2,
        week: 15,
        subtopics: [
          {
            id: 'w15-m3-t1',
            title: 'Training diagnostics, validation curves, and error analysis',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m3-t2',
            title: 'Dropout, normalisation, and introductory mixed-precision concepts',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m3-t3',
            title: 'Transfer learning and adapting pretrained models',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w15-m4',
        moduleNumber: 4,
        title: 'Guided Deep Learning Application',
        hours: 2,
        week: 15,
        subtopics: [
          {
            id: 'w15-m4-t1',
            title: 'Train or adapt a small model using a supplied scaffold',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m4-t2',
            title: 'Compare with a simple baseline and inspect failure cases',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w15-m4-t3',
            title: 'Save, reload, and run inference with recorded dependencies',
            week: 15,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-13',
    order: 13,
    courseCode: 'CDM-CVE-146',
    title: 'Computer Vision Engineer',
    weeks: [16],
    weekLabel: 'Week 16',
    liveHours: 8,
    tools: ['Pretrained YOLO', 'Pretrained vision models', 'OCR', 'Vision-language models'],
    brochurePage: 21,
    modules: [
      {
        id: 'w16-m1',
        moduleNumber: 1,
        title: 'Image Data and Transfer Learning',
        hours: 2,
        week: 16,
        subtopics: [
          {
            id: 'w16-m1-t1',
            title: 'Image representation, preprocessing, augmentation, and dataset splits',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m1-t2',
            title: 'CNN and vision-transformer concepts',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m1-t3',
            title: 'Pretrained image classification with a guided transfer-learning example',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w16-m2',
        moduleNumber: 2,
        title: 'Detection and Segmentation',
        hours: 2,
        week: 16,
        subtopics: [
          {
            id: 'w16-m2-t1',
            title: 'Bounding boxes, annotations, IoU, and precision/recall/mAP',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m2-t2',
            title: 'Guided object detection using a pretrained YOLO model',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m2-t3',
            title: 'Segmentation concepts, model selection, and annotation quality',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w16-m3',
        moduleNumber: 3,
        title: 'OCR and Document AI',
        hours: 2,
        week: 16,
        subtopics: [
          {
            id: 'w16-m3-t1',
            title: 'OCR, page layout, tables, and structured extraction',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m3-t2',
            title: 'Vision-language models for document/image questions',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m3-t3',
            title: 'Extraction validation, provenance, and sensitive-document handling',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w16-m4',
        moduleNumber: 4,
        title: 'Practical Evaluation and Inference',
        hours: 2,
        week: 16,
        subtopics: [
          {
            id: 'w16-m4-t1',
            title: 'Guided inference pipeline using a pretrained model',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m4-t2',
            title: 'Error analysis, domain shift, and robustness checks',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w16-m4-t3',
            title: 'Latency, batching, compute constraints, and API integration concepts',
            week: 16,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-14',
    order: 14,
    courseCode: 'CDM-NLP-147',
    title: 'Natural Language Processing',
    weeks: [17, 18, 19],
    weekLabel: 'Weeks 17–19',
    liveHours: 24,
    tools: ['LLM APIs', 'Open-weight models', 'PostgreSQL with pgvector', 'LangGraph', 'MCP', 'LoRA / QLoRA', 'FastAPI'],
    brochurePage: 22,
    modules: [
      {
        id: 'w17-m1',
        moduleNumber: 1,
        title: 'Modern NLP and Transformers',
        hours: 4,
        week: 17,
        subtopics: [
          {
            id: 'w17-m1-t1',
            title: 'Text cleaning, regex, tokenisation, and TF-IDF as a baseline',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w17-m1-t2',
            title: 'Contextual embeddings, semantic similarity, and pretrained text models',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w17-m1-t3',
            title: 'Attention, encoder/decoder architectures, and transformer intuition',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w17-m1-t4',
            title: 'Classification/extraction evaluation, including multilingual considerations',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w17-m2',
        moduleNumber: 2,
        title: 'LLM Application Engineering',
        hours: 4,
        week: 17,
        subtopics: [
          {
            id: 'w17-m2-t1',
            title: 'Hosted model APIs and open-weight inference options',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w17-m2-t2',
            title: 'Prompt specifications, few-shot examples, context limits, and model selection',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w17-m2-t3',
            title: 'Structured outputs, schema validation, streaming, and tool/function calling',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w17-m2-t4',
            title: 'Rate limits, retries, token usage, and basic cost controls',
            week: 17,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w18-m3',
        moduleNumber: 3,
        title: 'Retrieval-Augmented Generation',
        hours: 4,
        week: 18,
        subtopics: [
          {
            id: 'w18-m3-t1',
            title: 'Parsing, chunking, metadata, embeddings, and vector storage with PostgreSQL and pgvector',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w18-m3-t2',
            title: 'Semantic versus keyword/hybrid search and reranking concepts',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w18-m3-t3',
            title: 'Grounded responses, citations, abstention, and document updates',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w18-m3-t4',
            title: 'Retrieval/answer evaluation and access-aware retrieval principles',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w18-m4',
        moduleNumber: 4,
        title: 'Agentic Workflows and Integrations',
        hours: 4,
        week: 18,
        subtopics: [
          {
            id: 'w18-m4-t1',
            title: 'Fixed workflows versus agents; start with the simplest effective design',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w18-m4-t2',
            title: 'Tools, state, context, memory, routing, and stopping conditions',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w18-m4-t3',
            title: 'Agentic workflow orchestration using LangGraph, alongside direct SDK concepts',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w18-m4-t4',
            title: 'MCP fundamentals, permissions, approvals, retries, and safe repeated-action handling',
            week: 18,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w19-m5',
        moduleNumber: 5,
        title: 'Evaluation, Security, and Model Adaptation',
        hours: 4,
        week: 19,
        subtopics: [
          {
            id: 'w19-m5-t1',
            title: 'Held-out evaluation sets, regression tests, and task-success measures',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w19-m5-t2',
            title: 'Retrieval failures, hallucinations, tool errors, and human review',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w19-m5-t3',
            title: 'Prompt injection, data leakage, tracing, and feedback',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w19-m5-t4',
            title: 'Prompting versus RAG versus fine-tuning; LoRA/QLoRA and quantisation overview (Optional guided fine-tuning lab)',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
      {
        id: 'w19-m6',
        moduleNumber: 6,
        title: 'Integrated Application and Delivery',
        hours: 4,
        week: 19,
        subtopics: [
          {
            id: 'w19-m6-t1',
            title: 'Integrate a prepared RAG/agent application with a FastAPI endpoint',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w19-m6-t2',
            title: 'Guided containerisation/deployment demonstration and environment/secrets handling',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w19-m6-t3',
            title: 'Basic quality, latency, cost, and reliability checks',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w19-m6-t4',
            title: 'Customer acceptance criteria, demonstration, documentation, and handover',
            week: 19,
            provenance: 'DATAMITES_OFFICIAL',
          },
        ],
      },
    ],
  },
  {
    id: 'course-20',
    order: 15,
    courseCode: 'CDM-REV-020',
    title: 'Revision & Doubt-Clearing',
    weeks: [20],
    weekLabel: 'Week 20',
    liveHours: 8,
    tools: ['Revision', 'Mentor Q&A', 'Project Readiness'],
    brochurePage: 8,
    isRevisionWeek: true,
    modules: [
      {
        id: 'w20-m1',
        moduleNumber: 1,
        title: 'Comprehensive Syllabus Consolidation & Doubt-Clearing',
        hours: 8,
        week: 20,
        subtopics: [
          {
            id: 'w20-m1-t1',
            title: 'Consolidate Weeks 1–19 foundations, ML, data engineering, deep learning, CV, and NLP/LLM concepts',
            week: 20,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w20-m1-t2',
            title: 'Resolve saved mentor questions and weak areas in live doubt-clearing sessions (8 live hours)',
            week: 20,
            provenance: 'DATAMITES_OFFICIAL',
          },
          {
            id: 'w20-m1-t3',
            title: 'Prepare for the 3-month Internship & Projects Phase (40h mentoring, minimum 5 projects) — Note: Official batch exam format is UNVERIFIED in brochure',
            week: 20,
            provenance: 'UNVERIFIED',
          },
        ],
      },
    ],
  },
];

export const BONUS_COURSES: BonusCourseDef[] = [
  {
    id: 'bonus-01',
    courseCode: 'CDM-AAT-601',
    title: 'Applied AI Tools',
    valueLabel: '₹10,000 Bonus Certification Course',
    lectureHours: 12,
    learningHours: 30,
    brochurePage: 25,
    tools: ['ChatGPT', 'Claude AI', 'Perplexity AI', 'Gemini', 'Midjourney', 'Canva AI', 'HeyGen', 'Pictory', 'GitHub Copilot', 'Notion AI'],
    modules: [
      {
        id: 'b1-m1',
        moduleNumber: 1,
        title: 'AI Productivity (ChatGPT & Claude AI)',
        topics: [
          'Smart prompting techniques, research, summaries, data science use cases, resume/email/LinkedIn writing',
          'Long document analysis, report creation, strategy planning, reading PDFs and business documents',
        ],
        assignment: 'Create a business report using AI tools.',
      },
      {
        id: 'b1-m2',
        moduleNumber: 2,
        title: 'AI Research Tools (Perplexity AI & Gemini)',
        topics: [
          'Research and citation-based answers, market research and competitor analysis',
          'Google ecosystem integration, spreadsheet AI support, YouTube summarization, AI for students and analysts',
        ],
        assignment: 'Research an industry and create an insights report.',
      },
      {
        id: 'b1-m3',
        moduleNumber: 3,
        title: 'AI Design and Image Generation (Midjourney & Canva AI)',
        topics: [
          'Prompt writing for images, branding visuals, ad creatives and social media campaigns',
          'Posters, resumes, presentations, AI design shortcuts and brand kits, marketing creatives',
        ],
        assignment: 'Create an ad poster and campaign creative.',
      },
      {
        id: 'b1-m4',
        moduleNumber: 4,
        title: 'AI Video and Avatar Creation (HeyGen & Pictory)',
        topics: [
          'AI spokesperson videos, marketing and promo videos, multilingual content',
          'Convert blogs to videos, Reels creation and text to video, social media automation',
        ],
        assignment: 'Create a 30-second product promo video.',
      },
      {
        id: 'b1-m5',
        moduleNumber: 5,
        title: 'AI Coding and Data Science Support (GitHub Copilot & Notion AI)',
        topics: [
          'Python code generation, SQL queries, ML model support',
          'Documentation and project planning, team productivity, knowledge management',
        ],
        assignment: 'Build a mini AI project workflow.',
      },
    ],
  },
  {
    id: 'bonus-02',
    courseCode: 'CDM-PEN-602',
    title: 'Prompt Engineering',
    valueLabel: '₹5,000 Bonus Certification Course',
    lectureHours: 6,
    learningHours: 15,
    brochurePage: 26,
    tools: ['Claude', 'ChatGPT (OpenAI)', 'Microsoft Copilot', 'Gemini'],
    modules: [
      {
        id: 'b2-m1',
        moduleNumber: 1,
        title: 'Introduction to Prompt Engineering',
        topics: [
          'What is Prompt Engineering and why it matters; how AI models like Claude and ChatGPT work (high level)',
          'Types of prompts (instruction, conversational, contextual) and common beginner mistakes',
        ],
      },
      {
        id: 'b2-m2',
        moduleNumber: 2,
        title: 'Core Prompting Techniques',
        topics: [
          'Role-based prompting ("Act as…") and Zero-shot vs Few-shot prompting',
          'Chain-of-thought prompting (structured reasoning) and prompt structuring: clarity, constraints, format',
        ],
      },
      {
        id: 'b2-m3',
        moduleNumber: 3,
        title: 'Advanced Prompt Design',
        topics: [
          'Multi-step prompting workflows and prompt templates for repeat use',
          'Controlling tone, style and output format; debugging and improving weak prompts',
        ],
      },
      {
        id: 'b2-m4',
        moduleNumber: 4,
        title: 'Productivity and Content Creation',
        topics: [
          'Writing emails, reports, proposals; content generation; summarization and document analysis',
          'Hands-on: Create reusable prompt templates',
        ],
      },
      {
        id: 'b2-m5',
        moduleNumber: 5,
        title: 'Business and Functional Applications',
        topics: [
          'Marketing, Sales, HR, and Data basic analysis / insights generation',
          'Tools overview: Claude and ChatGPT (OpenAI), with Microsoft Copilot and Gemini used where appropriate',
        ],
      },
    ],
  },
  {
    id: 'bonus-03',
    courseCode: 'CDM-AAI-603',
    title: 'Certified Agentic AI Associate',
    valueLabel: '₹10,000 Bonus Certification Course',
    lectureHours: 8,
    learningHours: 20,
    brochurePage: 27,
    tools: ['Claude Ecosystem', 'Multi-Step Agentic Workflows'],
    modules: [
      {
        id: 'b3-m1',
        moduleNumber: 1,
        title: 'Foundations of Agentic AI',
        topics: [
          'Evolution: Generative AI → Agentic AI; core components: Goals, Planning, Memory, Actions',
          'How Agentic AI differs from traditional automation; types of AI agents and real-world applications',
        ],
      },
      {
        id: 'b3-m2',
        moduleNumber: 2,
        title: 'Claude Ecosystem and Intelligent Interaction',
        topics: [
          'Overview of Claude capabilities, large context, structured outputs, reasoning-based instructions, task decomposition',
          'Practical: Creating structured and reusable outputs',
        ],
      },
      {
        id: 'b3-m3',
        moduleNumber: 3,
        title: 'Designing Agentic Workflows',
        topics: [
          'Breaking problems into agent-driven tasks; chaining, iteration, refinement; memory and context management; role-based AI assistants',
          'Practical: Build a multi-step agentic workflow',
        ],
      },
      {
        id: 'b3-m4',
        moduleNumber: 4,
        title: 'Advanced Applications and Implementation',
        topics: [
          'Multi-agent systems and orchestration concepts; designing AI-driven business workflows; risk, validation and responsible AI usage',
          'Capstone: Build and present an Agentic AI solution using Claude',
        ],
      },
    ],
  },
];

export const OFFICIAL_COMPETENCY_AREAS: CompetencyAreaDef[] = [
  {
    id: 'comp-1',
    number: 1,
    title: 'Predictive Machine Learning',
    description: 'Data preparation, baseline comparison, tuning, explainability, and a tested prediction API.',
  },
  {
    id: 'comp-2',
    number: 2,
    title: 'Applied Data Science',
    description: 'Forecasting or anomaly detection, appropriate validation, and business impact analysis.',
  },
  {
    id: 'comp-3',
    number: 3,
    title: 'Business Intelligence',
    description: 'Data modelling, KPI calculations, and a stakeholder dashboard.',
  },
  {
    id: 'comp-4',
    number: 4,
    title: 'Computer Vision / Document AI',
    description: 'Pretrained model adaptation or document extraction, validation, and failure analysis.',
  },
  {
    id: 'comp-5',
    number: 5,
    title: 'Integrated Language AI',
    description: 'Document ingestion, RAG, grounded answers, a bounded tool-using workflow, and evaluation.',
  },
  {
    id: 'comp-6',
    number: 6,
    title: 'Application Delivery',
    description: 'Git-based collaboration, automated tests, Docker, cloud deployment, secrets management, and operational handover.',
  },
  {
    id: 'comp-7',
    number: 7,
    title: 'AI Operations',
    description: 'Data/model/prompt versioning, quality monitoring, tracing, latency and cost measurement, and failure recovery.',
  },
  {
    id: 'comp-8',
    number: 8,
    title: 'Industry Capstone',
    description: 'Requirements discovery, scope, acceptance criteria, stakeholder demonstrations, user feedback, documentation, and individual technical defence.',
  },
];

export const COMPLETION_CRITERIA_BY_WEEK: Record<number, CompletionCriteriaDef> = {
  1: {
    week: 1,
    understand: [
      'Distinguish descriptive, diagnostic, predictive, and prescriptive analytics and how DS/ML connect to AI.',
      'Explain data leakage, privacy/consent risks, and when simple rules or analytics beat ML.',
      'Differentiate responsibilities of Data Analyst, Data Scientist, Data Engineer, ML Engineer, and AI Engineer.',
    ],
    implement: [
      'Draft a structured problem-framing brief for a business scenario with explicit KPIs, baseline, and leakage risks.',
      'Classify 10 real-world scenarios into rules, BI analytics, regression, classification, or clustering.',
    ],
    evidence: [
      'Saved problem-framing brief linked in Practical Work or Learning Journal.',
      'Score >= 80% on Week 1 Revision Knowledge Check without guessing.',
    ],
  },
  2: {
    week: 2,
    understand: [
      'Explain virtual environments, mutable vs immutable collections, and function variable scope.',
      'Choose cleanly between list, tuple, set, dictionary, and comprehensions for a given problem.',
    ],
    implement: [
      'Configure an isolated Python virtual environment and run scripts cleanly in VS Code / Jupyter.',
      'Write modular Python functions using comprehensions, dictionaries, and edge-case handling.',
    ],
    evidence: [
      'Working Python script / notebook with clean functions and edge-case inputs committed or linked.',
      'Debugged sample script solving loop/scope bugs.',
    ],
  },
  3: {
    week: 3,
    understand: [
      'Explain exception handling (try/except/finally), type hints, logging vs print, and safe credential handling via environment variables.',
      'Describe how to review, test, and verify AI-generated code instead of blindly trusting it.',
    ],
    implement: [
      'Build a reliable Python CLI utility that reads/writes CSV & JSON with structured logging and unit assertions.',
      'Consume a public REST API with requests, parse JSON responses safely, handle HTTP errors, and load secrets from .env.',
    ],
    evidence: [
      'Executable Python module with passing tests, .env.example, and API error-handling verification.',
    ],
  },
  4: {
    week: 4,
    understand: [
      'Interpret central tendency, spread, skewness, percentiles, correlation vs causation, and Bayes theorem intuitively.',
      'Explain p-values, confidence intervals, Type I/II errors, effect size, and common A/B testing pitfalls.',
      'Explain dot products, cosine/Euclidean similarity, and how derivatives drive gradient descent.',
    ],
    implement: [
      'Run a statistical summary and outlier check on a small business dataset in Python.',
      'Compute a two-group A/B test p-value and confidence interval and write a plain-English business recommendation.',
    ],
    evidence: [
      'Completed notebook containing statistical summary, A/B test interpretation, and vector similarity calculation.',
    ],
  },
  5: {
    week: 5,
    understand: [
      'Explain NumPy vectorisation/broadcasting and pandas grouping/merging semantics.',
      'Explain why preprocessing must be fitted strictly on training data inside a scikit-learn Pipeline to avoid leakage.',
    ],
    implement: [
      'Clean a messy tabular CSV (missing values, duplicates, wrong dtypes) and run exploratory plots in Matplotlib/Seaborn.',
      'Create a leak-free train/validation/test split and wrap preprocessing + baseline estimator in a scikit-learn Pipeline.',
    ],
    evidence: [
      'Reproducible EDA + baseline Pipeline notebook showing zero data leakage.',
    ],
  },
  6: {
    week: 6,
    understand: [
      'Contrast regression (MAE/RMSE) and classification (Precision/Recall/F1/Confusion Matrix) evaluation metrics.',
      'Explain bias-variance tradeoff, cross-validation, K-means cluster interpretation, and feature scaling impact.',
    ],
    implement: [
      'Train and compare Linear/Logistic Regression, KNN, and Decision Tree baselines using cross-validation.',
      'Run K-means clustering on scaled features and interpret cluster profiles for a business decision.',
    ],
    evidence: [
      'Model comparison table (metrics + CV variance) and cluster interpretation notes saved to repo/evidence.',
    ],
  },
  7: {
    week: 7,
    understand: [
      'Explain ColumnTransformer encoding/imputation, PCA dimensionality reduction, and CV leakage traps.',
      'Compare Bagging/Random Forest vs Gradient Boosting (XGBoost, LightGBM, CatBoost) tradeoffs.',
    ],
    implement: [
      'Build a full scikit-learn ColumnTransformer + XGBoost/LightGBM pipeline evaluated via stratified/k-fold CV.',
      'Compare Random Forest vs XGBoost vs LightGBM on validation metric, training time, and complexity.',
    ],
    evidence: [
      'Notebook/script with reproducible CV benchmark comparing ensemble models without leakage.',
    ],
  },
  8: {
    week: 8,
    understand: [
      'Explain why resampling (e.g., SMOTE) must happen inside CV training folds only, never before splitting.',
      'Explain probability calibration, business-cost-driven threshold selection, and SHAP limitations (correlated features).',
    ],
    implement: [
      'Run RandomizedSearchCV or Optuna tuning on an imbalanced classification task with class weights and threshold tuning.',
      'Generate SHAP summary/local plots and perform subgroup error analysis.',
    ],
    evidence: [
      'Reproducible model-selection report detailing chosen threshold, business error cost, SHAP findings, and error slices.',
    ],
  },
  9: {
    week: 9,
    understand: [
      'Explain why random k-fold leaks future data in time series and how walk-forward validation works.',
      'Decide clearly when predictive ML, RAG retrieval, or an agent is appropriate for a business use case.',
    ],
    implement: [
      'Benchmark a seasonal-naive baseline against ARIMA/SARIMA using walk-forward validation.',
      'Save a trained ML pipeline with joblib and expose it via a validated FastAPI /predict endpoint with error handling.',
    ],
    evidence: [
      'Working FastAPI prediction service with Pydantic validation and curl/pytest endpoint verification.',
    ],
  },
  10: {
    week: 10,
    understand: [
      'Design normalized relational tables with keys/constraints and write CTEs + SQL window functions accurately.',
      'Contrast relational (PostgreSQL) vs document (MongoDB) vs vector storage for AI metadata and embeddings.',
    ],
    implement: [
      'Write analytical PostgreSQL queries using JOINs, CTEs, and ROW_NUMBER/SUM OVER window functions.',
      'Query PostgreSQL and MongoDB safely from Python using parameterised queries (preventing SQL injection).',
    ],
    evidence: [
      'SQL script + Python database integration script demonstrating parameterised queries and clean JSON metadata storage.',
    ],
  },
  11: {
    week: 11,
    understand: [
      'Explain git revert vs git reset and why shared history must not be force-rewritten.',
      'Explain secrets hygiene (.gitignore, no API keys or raw datasets in Git) and AI-code review discipline.',
    ],
    implement: [
      'Run a complete feature-branch -> PR -> merge conflict resolution -> tag/release workflow on GitHub.',
      'Add pytest + ruff/flake8 linting into a minimal GitHub Actions CI workflow with a clean README.',
    ],
    evidence: [
      'Public/private GitHub repository URL with green GitHub Actions check and clean commit history.',
    ],
  },
  12: {
    week: 12,
    understand: [
      'Explain batch vs streaming, columnar Parquet advantages, partitioning, and dataset lineage/access governance.',
      'Describe PySpark lazy evaluation, transformations vs actions, and shuffling implications.',
    ],
    implement: [
      'Build an idempotent ingestion pipeline reading raw files, running schema/duplicate checks, and writing partitioned Parquet.',
      'Execute filtering, joins, aggregations, and Spark SQL queries on a PySpark DataFrame.',
    ],
    evidence: [
      'PySpark script/notebook producing validated Parquet outputs with documented schema checks and lineage metadata.',
    ],
  },
  13: {
    week: 13,
    understand: [
      'Explain star-schema relationships, date dimensions, and Measures vs Calculated Columns in DAX.',
      'Relate technical AI metrics (precision, latency, token cost) directly to stakeholder business KPIs.',
    ],
    implement: [
      'Clean and model prepared CSV/SQL tables in Power Query and author core DAX measures.',
      'Design a clear, non-misleading stakeholder dashboard tracking KPIs and AI-service quality/cost/latency.',
    ],
    evidence: [
      'Completed Power BI workbook (.pbix) or dashboard screenshots with documented KPI definitions.',
    ],
  },
  14: {
    week: 14,
    understand: [
      'Compare rules vs predictive ML vs LLMs and hosted vs open-weight models across quality, latency, cost, and privacy.',
      'Identify prompt injection, data leakage, permission boundary, and licensing governance risks.',
    ],
    implement: [
      'Write a complete AI System Design spec (architecture diagram, model choice, acceptance criteria, test cases, and risk controls).',
      'Verify a clean Python AI project environment with pinned dependencies and environment-variable API key checks.',
    ],
    evidence: [
      'System design document + verified environment setup checklist saved to repo/journal.',
    ],
  },
  15: {
    week: 15,
    understand: [
      'Explain forward pass, loss, backpropagation intuition, optimisers (SGD/Adam), learning rate, dropout, and batch/layer norm.',
      'Diagnose overfitting vs underfitting from training/validation loss curves.',
    ],
    implement: [
      'Write a clean PyTorch Dataset, DataLoader, and compact training + validation loop with seeds and checkpointing.',
      'Adapt a small pretrained model, compare against a simple baseline, inspect failure cases, and reload weights for inference.',
    ],
    evidence: [
      'Reproducible PyTorch notebook/script with saved checkpoint, validation curves, and failure-case inspection.',
    ],
  },
  16: {
    week: 16,
    understand: [
      'Explain CNN vs ViT concepts, bounding boxes, IoU, precision/recall/mAP, and domain shift in vision models.',
      'Explain OCR + layout/table extraction validation and sensitive-document provenance.',
    ],
    implement: [
      'Run pretrained transfer-learning image classification and pretrained YOLO object detection on sample images.',
      'Build an inference/document-extraction script with error analysis and latency/batching timing notes.',
    ],
    evidence: [
      'Working CV/OCR inference notebook with IoU/mAP or extraction accuracy inspection and failure examples.',
    ],
  },
  17: {
    week: 17,
    understand: [
      'Explain tokenisation, TF-IDF baseline vs contextual embeddings, self-attention, and encoder/decoder transformers.',
      'Explain structured output schema validation, tool/function calling, rate limits, retries, and token cost controls.',
    ],
    implement: [
      'Compare a TF-IDF text classifier baseline against pretrained embeddings on a small labeled dataset.',
      'Build a resilient LLM client wrapper with JSON schema validation, retry/backoff, and token usage logging.',
    ],
    evidence: [
      'Evaluation comparison + tested structured-output LLM utility script.',
    ],
  },
  18: {
    week: 18,
    understand: [
      'Explain chunking strategies, metadata filtering, hybrid search + reranking, grounding/citations, and abstention.',
      'Explain when fixed workflows outperform open-ended agents, plus LangGraph state/routing and MCP permission boundaries.',
    ],
    implement: [
      'Build a RAG pipeline indexing chunked documents with metadata into PostgreSQL/pgvector (or local vector store) returning grounded cited answers.',
      'Implement a bounded LangGraph workflow with explicit state, conditional routing, and safe stopping conditions.',
    ],
    evidence: [
      'Working RAG + LangGraph workflow repository demonstrating citations, abstention on unanswerable queries, and bounded execution.',
    ],
  },
  19: {
    week: 19,
    understand: [
      'Distinguish when to use Prompting vs RAG vs Fine-Tuning (LoRA/QLoRA/quantisation tradeoffs).',
      'Explain held-out regression evals, hallucination/retrieval failure diagnosis, prompt injection defenses, and container handover.',
    ],
    implement: [
      'Create a small held-out evaluation suite measuring retrieval hit-rate and grounded task success.',
      'Wrap the RAG/agent workflow behind a FastAPI endpoint with Docker containerisation, .env secrets handling, and latency/cost logging.',
    ],
    evidence: [
      'Containerised FastAPI RAG/agent repo with eval report, handover README, and acceptance-criteria checklist.',
    ],
  },
  20: {
    week: 20,
    understand: [
      'Synthesize end-to-end AI engineering architecture from data ingestion and classical ML through deep learning, CV, RAG, and production delivery.',
      'Resolve all remaining weak concepts and mentor questions before entering Phase 2 (Internship & Projects).',
    ],
    implement: [
      'Complete a cross-syllabus revision audit clearing all "Needs revision" subtopics and saved weak concepts.',
      'Draft your Phase 2 project roadmap aligned to the 8 DataMites competency areas (minimum 5 official projects).',
    ],
    evidence: [
      'Zero unresolved critical weak concepts, mentor Q&A notes logged, and Phase 2 project plan ready.',
    ],
  },
};

export function getCourseForWeek(week: number): OfficialCourseDef {
  return (
    OFFICIAL_CURRICULUM.find((c) => c.weeks.includes(week)) ??
    OFFICIAL_CURRICULUM[0]
  );
}

export function getModulesForWeek(week: number) {
  const course = getCourseForWeek(week);
  return course.modules.filter((m) => m.week === week);
}

export function getAllSubtopics() {
  return OFFICIAL_CURRICULUM.flatMap((course) =>
    course.modules.flatMap((mod) =>
      mod.subtopics.map((sub) => ({
        ...sub,
        courseId: course.id,
        courseCode: course.courseCode,
        courseTitle: course.title,
        moduleId: mod.id,
        moduleNumber: mod.moduleNumber,
        moduleTitle: mod.title,
      }))
    )
  );
}

export function getSubtopicsForWeek(week: number) {
  return getAllSubtopics().filter((s) => s.week === week);
}
