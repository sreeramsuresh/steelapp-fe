import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { api } from "../api.js";
import { shippingDocumentService } from "../shippingDocumentService.js";