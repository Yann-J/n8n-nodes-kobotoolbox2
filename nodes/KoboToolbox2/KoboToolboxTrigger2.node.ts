import {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import {
	downloadAttachments,
	formatSubmission,
	koboToolboxApiRequest,
	loadForms,
	parseStringList,
} from './GenericFunctions';

import { options } from './Options';

export class KoboToolboxTrigger2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KoboToolbox Trigger 2',
		name: 'koboToolboxTrigger2',
		icon: 'file:koboToolbox.svg',
		group: ['trigger'],
		version: 1,
		description: 'Process KoboToolbox submissions',
		defaults: {
			name: 'KoboToolbox Trigger',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'koboToolbox2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Form Name or ID',
				name: 'formId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'loadForms',
				},
				required: true,
				default: '',
				description:
					'Form ID (e.g. aSAvYreNzVEkrWg5Gdcvg). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},
			{
				displayName: 'Trigger On',
				name: 'triggerOn',
				type: 'options',
				required: true,
				default: 'formSubmission',
				options: [
					{
						name: 'On Form Submission',
						value: 'formSubmission',
					},
				],
			},
			{ ...options },
		],
	};

	// @ts-ignore
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const formId = this.getNodeParameter('formId') as string; //tslint:disable-line:variable-name
				const webhooks = await koboToolboxApiRequest.call(this, {
					url: `/api/v2/assets/${formId}/hooks/`,
				});
				for (const webhook of webhooks || []) {
					if (webhook.endpoint === webhookUrl && webhook.active === true) {
						webhookData.webhookId = webhook.uid;
						return true;
					}
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const workflow = this.getWorkflow();
				const formId = this.getNodeParameter('formId') as string; //tslint:disable-line:variable-name

				const response = await koboToolboxApiRequest.call(this, {
					method: 'POST',
					url: `/api/v2/assets/${formId}/hooks/`,
					body: {
						name: `n8n webhook id ${workflow.id}: ${workflow.name}`,
						endpoint: webhookUrl,
						email_notification: true,
					},
				});

				if (response.uid) {
					webhookData.webhookId = response.uid;
					return true;
				}

				return false;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const formId = this.getNodeParameter('formId') as string; //tslint:disable-line:variable-name
				try {
					await koboToolboxApiRequest.call(this, {
						method: 'DELETE',
						url: `/api/v2/assets/${formId}/hooks/${webhookData.webhookId}`,
					});
				} catch (error) {
					return false;
				}
				delete webhookData.webhookId;
				return true;
			},
		},
	};

	methods = {
		loadOptions: {
			loadForms,
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const formatOptions = this.getNodeParameter('formatOptions') as IDataObject;

		// prettier-ignore
		const responseData = formatOptions.reformat
			? formatSubmission(req.body, parseStringList(formatOptions.selectMask as string), parseStringList(formatOptions.numberMask as string))
			: req.body;

		if (formatOptions.download) {
			// Download related attachments
			return {
				workflowData: [[await downloadAttachments.call(this, responseData, formatOptions)]],
			};
		} else {
			return {
				workflowData: [this.helpers.returnJsonArray([responseData])],
			};
		}
	}
}
