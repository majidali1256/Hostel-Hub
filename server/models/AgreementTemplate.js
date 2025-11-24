const mongoose = require('mongoose');

const agreementTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['lease', 'rental', 'sublease', 'rules'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    variables: [{
        name: String,
        description: String,
        required: { type: Boolean, default: true },
        defaultValue: String
    }],
    defaultTerms: [{
        title: String,
        content: String,
        required: { type: Boolean, default: true }
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['standard', 'short-term', 'long-term', 'student', 'vacation'],
        default: 'standard'
    },
    language: {
        type: String,
        default: 'en'
    },
    jurisdiction: {
        country: String,
        state: String,
        city: String
    },
    version: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Methods
agreementTemplateSchema.methods.generateAgreement = function (data) {
    let content = this.content;

    // Replace variables
    this.variables.forEach(variable => {
        const value = data[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
        content = content.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
    });

    return {
        title: this.name,
        content,
        terms: this.defaultTerms,
        type: this.type,
        templateId: this._id
    };
};

module.exports = mongoose.model('AgreementTemplate', agreementTemplateSchema);
