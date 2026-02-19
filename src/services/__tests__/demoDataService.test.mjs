import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { demoDataService } from "../demoDataService.js";
import { notificationService } from "../notificationService.js";
import { productService } from "../productService.js";