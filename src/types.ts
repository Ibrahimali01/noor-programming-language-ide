/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NoorFile {
  id: string;
  name: string;
  content: string;
  category: 'system' | 'mobile' | 'web' | 'game' | 'math' | 'automation';
}

export interface PackageModule {
  name: string;
  version: string;
  description: string;
  downloads: string;
  author: string;
  isInstalled: boolean;
}

export interface TutorialLesson {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  arabicDescription: string;
  codeTemplate: string;
  task: string;
  arabicTask: string;
  expectedOutputContains: string;
}

export interface LibraryMetadata {
  name: string;
  classification: string;
  primaryFunction: string;
  keywords: string[];
}

export interface NoorAIModel {
  name: string;
  description: string;
  type: string;
  status: 'active' | 'deploying' | 'offline';
}
