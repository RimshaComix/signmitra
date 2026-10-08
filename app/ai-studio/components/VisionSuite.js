'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Camera,
  Upload,
  RefreshCcw,
  Sparkles,
  FileText,
  Tag,
  Copy,
  Check,
  ShieldCheck,
  ListPlus,
  BellRing,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function VisionSuite({
  onSendToClarification,
  onSendToPlanner
}) {
  const {
    cardBg,
    cardInnerBg,
    borderTone,
    accentSolid,
    isDarkTheme
  } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState('queue');

  const [imageSrc, setImageSrc] = useState(null);
  const [imageMime, setImageMime] = useState('image/jpeg');

  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [ocrResult, setOcrResult] = useState(null);
  const [editableText, setEditableText] = useState('');
  const [savedToQueueMsg, setSavedToQueueMsg] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Camera access is not supported by this browser.'
        );
      }

      setIsCapturingCamera(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setIsCapturingCamera(false);

      alert(
        `Camera access failed: ${
          err?.message || 'Unknown error'
        }`
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturingCamera(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext('2d');

    if (!context) {
      alert('Unable to capture camera frame.');
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL(
      'image/jpeg',
      0.9
    );

    setImageSrc(dataUrl);
    setImageMime('image/jpeg');

    stopCamera();

    analyzeImage(dataUrl, 'image/jpeg');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result;

      if (typeof dataUrl !== 'string') {
        alert('Unable to read the selected image.');
        return;
      }

      setImageSrc(dataUrl);
      setImageMime(
        file.type || 'image/jpeg'
      );

      analyzeImage(
        dataUrl,
        file.type || 'image/jpeg'
      );
    };

    reader.onerror = () => {
      alert('Unable to read the selected image.');
    };

    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleUseSample = (sampleType) => {
    setImageSrc(
      `/sample-${sampleType}.png`
    );

    analyzeImage(
      null,
      'image/jpeg',
      sampleType
    );
  };

  const analyzeImage = async (
    base64Data,
    mimeType,
    sampleType = ''
  ) => {
    setIsProcessing(true);
    setSavedToQueueMsg(false);
    setOcrResult(null);
    setEditableText('');

    try {
      const response = await fetch(
        '/api/ai-studio',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'understand_image',
            imageBase64: base64Data,
            imageMimeType: mimeType,
            featureType: activeSubTab,
            sampleType
          })
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          'The image analysis service returned an invalid response.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Image analysis failed with status ${response.status}.`
        );
      }

      console.log(
        'SIGNMITRA VISION RESPONSE:',
        data
      );

      setOcrResult(data);

      setEditableText(
        data?.extractedText ||
          data?.extracted_text ||
          ''
      );
    } catch (error) {
      console.error(
        'Vision analysis error:',
        error
      );

      setOcrResult({
        error:
          error?.message ||
          'Image processing failed.'
      });

      alert(
        error?.message ||
          'Image processing failed.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getProviderInfo = () => {
    if (!ocrResult) return null;

    const provider = String(
      ocrResult.provider ||
        ocrResult.source ||
        ocrResult.provenance ||
        ocrResult.engine ||
        ''
    ).toLowerCase();

    if (provider.includes('groq')) {
      return {
        label: 'AI Vision · Groq',
        description:
          'Image analyzed using Groq Vision.',
        fallback: false,
        unavailable: false,
        demo: false
      };
    }

    if (
      provider.includes('gemini') ||
      provider.includes('google')
    ) {
      return {
        label: 'AI Vision · Gemini',
        description:
          'Image analyzed using Gemini Vision.',
        fallback: false,
        unavailable: false,
        demo: false
      };
    }

    if (
      provider === 'vision-unavailable' ||
      provider.includes('vision-unavailable')
    ) {
      return {
        label: 'Vision Unavailable',
        description:
          ocrResult.message ||
          ocrResult.disclaimer ||
          'No live vision provider is configured.',
        fallback: true,
        unavailable: true,
        demo: false
      };
    }

    if (
      provider.includes('deterministic') ||
      provider.includes('demo')
    ) {
      return {
        label: 'Demo / Deterministic Sample',
        description:
          'This result comes from SignMitra sample data and is not extracted from a live image.',
        fallback: true,
        unavailable: false,
        demo: true
      };
    }

    if (
      ocrResult.fallback === true ||
      provider.includes('fallback')
    ) {
      return {
        label: 'Fallback Processing',
        description:
          ocrResult.message ||
          ocrResult.disclaimer ||
          'The live processing provider was unavailable.',
        fallback: true,
        unavailable: true,
        demo: false
      };
    }

    if (
      ocrResult.provider ||
      ocrResult.source ||
      ocrResult.provenance ||
      ocrResult.engine
    ) {
      return {
        label: String(
          ocrResult.provider ||
            ocrResult.source ||
            ocrResult.provenance ||
            ocrResult.engine
        ),
        description:
          'Processing source reported by the analysis service.',
        fallback: false,
        unavailable: false,
        demo: false
      };
    }

    return {
      label: 'Processing Source Not Reported',
      description:
        'The backend did not provide provider provenance.',
      fallback: true,
      unavailable: true,
      demo: false
    };
  };

  const providerInfo =
    getProviderInfo();

  /*
   * ---------------------------------------------------------
   * GENERIC RESPONSE NORMALIZATION
   * ---------------------------------------------------------
   *
   * Supports both camelCase and snake_case responses.
   * This allows the backend to evolve without breaking UI.
   */

  const structuredFields =
    ocrResult?.structuredFields ||
    ocrResult?.structured_fields ||
    {};

  const extractedText =
    ocrResult?.extractedText ||
    ocrResult?.extracted_text ||
    '';

  const imageDescription =
    ocrResult?.imageDescription ||
    ocrResult?.image_description ||
    '';

  const detectedType =
    ocrResult?.detectedType ||
    ocrResult?.detected_type ||
    structuredFields?.document_category ||
    structuredFields?.documentCategory ||
    'general';

  const documentBreakdown =
    ocrResult?.documentBreakdown ||
    ocrResult?.document_breakdown ||
    {};

  /*
   * Generic value reader.
   */
  const getField = (...keys) => {
    for (const key of keys) {
      const value =
        structuredFields?.[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'Not visible' &&
        value !== 'N/A' &&
        value !== 'Unknown'
      ) {
        return value;
      }
    }

    return null;
  };

  const asArray = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value;
    }

    return [value];
  };

  /*
   * Generic document data.
   */
  const merchant =
    getField(
      'merchant_or_organization',
      'merchantOrOrganization',
      'merchant',
      'organization'
    );

  const documentNumber =
    getField(
      'document_number',
      'documentNumber',
      'invoice_number',
      'invoiceNumber',
      'bill_number',
      'billNumber',
      'order_number',
      'orderNumber'
    );

  const serviceType =
    getField(
      'service_type',
      'serviceType'
    );

  const tableNumber =
    getField(
      'table_number',
      'tableNumber'
    );

  const cashier =
    getField(
      'cashier',
      'cashier_name',
      'cashierName'
    );

  const paymentMethod =
    getField(
      'payment_method',
      'paymentMethod'
    );

  const paymentStatus =
    getField(
      'payment_status',
      'paymentStatus'
    );

  const totalAmount =
    getField(
      'total_amount',
      'totalAmount',
      'total',
      'grand_total',
      'grandTotal'
    );

  const subtotal =
    getField(
      'subtotal',
      'sub_total',
      'subTotal'
    );

  const tax =
    getField(
      'tax',
      'tax_amount',
      'taxAmount',
      'gst'
    );

  const discount =
    getField(
      'discount',
      'discount_amount',
      'discountAmount'
    );

  const dates = asArray(
    getField(
      'dates',
      'key_dates',
      'keyDates'
    )
  );

  const times = asArray(
    getField(
      'times'
    )
  );

  const items = asArray(
    getField(
      'items',
      'line_items',
      'lineItems'
    )
  );

  const amounts = asArray(
    getField(
      'amounts'
    )
  );

  const instructions = asArray(
    getField(
      'instructions'
    )
  );

  const actionItems = asArray(
    getField(
      'action_items',
      'actionItems'
    )
  );

  const contactDetails = asArray(
    getField(
      'contact_details',
      'contactDetails'
    )
  );

  const location = getField(
    'location',
    'address'
  );

  /*
   * Queue-specific fields.
   */
  const tokenNumber =
    getField(
      'token_number',
      'tokenNumber'
    );

  const counterNumber =
    getField(
      'counter_number',
      'counterNumber',
      'department',
      'department_name',
      'departmentName',
      'room',
      'room_number',
      'roomNumber'
    );

  const hasQueueData =
    Boolean(
      tokenNumber ||
      getField(
        'counter_number',
        'counterNumber'
      ) ||
      getField(
        'department',
        'department_name',
        'departmentName'
      ) ||
      getField(
        'room',
        'room_number',
        'roomNumber'
      )
    );

  /*
   * Build queue data only when actual queue-like
   * information exists.
   */
  const normalizedQueueDetails =
    ocrResult?.queueDetails ||
    ocrResult?.queue_details ||
    (hasQueueData
      ? {
          tokenNumber:
            tokenNumber ||
            'Not visible',

          counterNumber:
            counterNumber ||
            'Not visible',

          dateTime:
            [
              ...dates,
              ...times
            ].join(' ') ||
            'Not visible',

          instructions:
            instructions.join('; ') ||
            'Not visible'
        }
      : null);

  /*
   * Build generic document breakdown.
   *
   * This is the important part for restaurant bills,
   * invoices, receipts, tickets, etc.
   */
  const normalizedDocumentBreakdown = {
    plainSummary:
      documentBreakdown?.plainSummary ||
      documentBreakdown?.plain_summary ||
      structuredFields?.document_summary ||
      structuredFields?.documentSummary ||
      imageDescription ||
      extractedText?.split('\n')[0] ||
      'Information extracted from the uploaded image.',

    documentCategory:
      documentBreakdown?.documentCategory ||
      documentBreakdown?.document_category ||
      structuredFields?.document_category ||
      structuredFields?.documentCategory ||
      detectedType,

    merchantOrOrganization:
      documentBreakdown?.merchantOrOrganization ||
      documentBreakdown?.merchant_or_organization ||
      merchant,

    documentNumber:
      documentBreakdown?.documentNumber ||
      documentBreakdown?.document_number ||
      documentNumber,

    dates:
      documentBreakdown?.keyDates ||
      documentBreakdown?.key_dates ||
      dates,

    times,

    amounts:
      documentBreakdown?.amounts ||
      amounts,

    subtotal,

    tax,

    discount,

    totalAmount,

    lineItems:
      documentBreakdown?.lineItems ||
      documentBreakdown?.line_items ||
      items,

    serviceType,

    tableNumber,

    cashier,

    paymentDetails:
      documentBreakdown?.paymentDetails ||
      documentBreakdown?.payment_details ||
      {
        method: paymentMethod,
        status: paymentStatus
      },

    contactDetails,

    location,

    actionItems:
      documentBreakdown?.actionItems ||
      documentBreakdown?.action_items ||
      actionItems,

    instructions
  };

  const hasDocumentInformation =
    Boolean(
      normalizedDocumentBreakdown.plainSummary ||
      merchant ||
      documentNumber ||
      totalAmount ||
      subtotal ||
      tax ||
      items.length ||
      paymentMethod ||
      serviceType ||
      tableNumber ||
      cashier ||
      dates.length ||
      amounts.length ||
      contactDetails.length ||
      location
    );

  const handleSaveToQueue = () => {
    if (!normalizedQueueDetails) {
      return;
    }

    const q =
      normalizedQueueDetails;

    const newQueueToken = {
      tokenNumber:
        q.tokenNumber ||
        'T-99',

      institution:
        q.institution ||
        merchant ||
        'Extracted Notice / Counter',

      locationRoom:
        q.counterNumber ||
        'Counter Assigned',

      appointmentTime:
        q.dateTime ||
        'Today',

      currentStage: 'waiting',

      documentsNeeded: [
        {
          id: '1',
          name: 'Original Fee Slip / ID Card',
          checked: true
        },
        {
          id: '2',
          name: 'Prescribed Form',
          checked: false
        }
      ],

      notes:
        q.instructions ||
        'Visual alert requested.',

      isDemo:
        providerInfo?.demo === true
    };

    localStorage.setItem(
      'signmitra_queue_active',
      JSON.stringify(newQueueToken)
    );

    setSavedToQueueMsg(true);

    setTimeout(() => {
      setSavedToQueueMsg(false);
    }, 4000);
  };

  const handleSaveDocToPlanner = () => {
    if (!hasDocumentInformation) {
      return;
    }

    const breakdown =
      normalizedDocumentBreakdown;

    const actionText =
      breakdown.actionItems?.[0] ||
      breakdown.instructions?.[0] ||
      'Review extracted document information';

    const task = {
      id: `TASK-${Date.now()}`,

      title:
        `Visual Document: ${actionText}`,

      situation:
        'Visual Document Extraction',

      category:
        'Documents & Applications',

      type:
        'Action Step',

      nextAction:
        actionText,

      dueDate:
        breakdown.dates?.[0] ||
        new Date()
          .toISOString()
          .split('T')[0],

      priority: 'High',

      status: 'Planned',

      source: 'Vision Suite',

      requiresUserVerification: true
    };

    const existing =
      JSON.parse(
        localStorage.getItem(
          'signmitra_followups'
        ) || '[]'
      );

    localStorage.setItem(
      'signmitra_followups',
      JSON.stringify([
        task,
        ...existing
      ])
    );

    alert(
      'Action step saved to Follow-Up Planner (/followups)!'
    );
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(
        editableText
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Copy failed:',
        error
      );

      alert('Unable to copy text.');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveSubTab(tabId);

    setOcrResult(null);
    setEditableText('');
    setSavedToQueueMsg(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Sub-Tabs */}
      <div
        className={`p-2 rounded-2xl border-2 ${borderTone} ${cardBg} flex flex-wrap gap-2 shadow-sm`}
      >
        {[
          {
            id: 'queue',
            label: 'Queue & Token Reader',
            icon: Tag
          },
          {
            id: 'ocr',
            label: 'Text Reader (OCR)',
            icon: Camera
          },
          {
            id: 'document',
            label: 'Notice & Documents',
            icon: FileText
          },
          {
            id: 'description',
            label: 'Image Description',
            icon: Sparkles
          }
        ].map((tab) => {
          const Icon = tab.icon;

          const isActive =
            activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() =>
                handleTabChange(tab.id)
              }
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? accentSolid
                  : `${cardInnerBg} opacity-70 hover:opacity-100`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />

              <span>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Capture / Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Input */}
        <div
          className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm`}
        >

          <div className="flex justify-between items-center">

            <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
              Select Image Input
            </span>

            <span className="text-[10px] font-mono opacity-50">
              Privacy-Aware Processing
            </span>

          </div>

          {isCapturingCamera ? (
            <div className="space-y-3">

              <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">

                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                <canvas
                  ref={canvasRef}
                  className="hidden"
                />

              </div>

              <div className="flex gap-2">

                <button
                  onClick={captureSnapshot}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider ${accentSolid} flex items-center justify-center gap-2`}
                >
                  <Camera className="w-4 h-4" />

                  <span>
                    Take Snapshot
                  </span>
                </button>

                <button
                  onClick={stopCamera}
                  className={`py-3 px-4 rounded-xl border-2 ${borderTone} ${cardInnerBg} font-bold text-xs uppercase`}
                >
                  Cancel
                </button>

              </div>

            </div>
          ) : (
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-2.5">

                <button
                  onClick={startCamera}
                  className={`p-4 rounded-xl border-2 border-dashed ${borderTone} ${cardInnerBg} hover:border-[#655A7C] font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all`}
                >
                  <Camera className="w-5 h-5 opacity-70" />

                  <span>
                    Use Device Camera
                  </span>
                </button>

                <button
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className={`p-4 rounded-xl border-2 border-dashed ${borderTone} ${cardInnerBg} hover:border-[#655A7C] font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all`}
                >
                  <Upload className="w-5 h-5 opacity-70" />

                  <span>
                    Upload File / Photo
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

              </div>

              <div
                className="pt-2 border-t border-dashed"
                style={{
                  borderColor:
                    isDarkTheme
                      ? '#AB92BF30'
                      : '#655A7C20'
                }}
              >

                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block mb-2">
                  Or test with sample image data:
                </span>

                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={() =>
                      handleUseSample('token')
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    🏷️ Queue Token B-34
                  </button>

                  <button
                    onClick={() =>
                      handleUseSample('notice')
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    📋 Exam Hall Notice
                  </button>

                  <button
                    onClick={() =>
                      handleUseSample('prescription')
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${cardInnerBg} ${borderTone} hover:border-[#655A7C]`}
                  >
                    🩺 OPD Lab Referral
                  </button>

                </div>

              </div>

            </div>
          )}

          {imageSrc &&
            !isCapturingCamera && (
              <div
                className={`p-3 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
              >

                <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                  Loaded Image:
                </span>

                <div className="rounded-lg overflow-hidden max-h-48 flex items-center justify-center bg-black/10">

                  <img
                    src={imageSrc}
                    alt="Uploaded visual"
                    className="max-h-48 object-contain"
                  />

                </div>

              </div>
            )}

        </div>

        {/* Results */}
        <div
          className={`p-5 rounded-2xl border-2 ${borderTone} ${cardBg} space-y-4 shadow-sm flex flex-col justify-between`}
        >

          <div>

            <div className="flex justify-between items-start mb-3 gap-3">

              <div className="flex items-center gap-1.5">

                <Sparkles className="w-3.5 h-3.5 opacity-80" />

                <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                  Extracted Intelligence
                </span>

              </div>

              {ocrResult &&
                !ocrResult.error &&
                providerInfo && (
                  <div className="flex flex-col items-end gap-1">

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        providerInfo.unavailable
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                          : providerInfo.demo
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : accentSolid
                      }`}
                    >
                      {providerInfo.label}
                    </span>

                    {ocrResult.confidence && (
                      <span className="text-[9px] font-mono opacity-50">
                        Confidence:{' '}
                        {ocrResult.confidence}
                      </span>
                    )}

                  </div>
                )}

            </div>

            {ocrResult &&
              !ocrResult.error &&
              providerInfo && (
                <div
                  className={`mb-4 p-2.5 rounded-lg border ${
                    providerInfo.unavailable
                      ? 'border-red-500/30 bg-red-500/5'
                      : providerInfo.demo
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : `${borderTone} ${cardInnerBg}`
                  }`}
                >

                  <div className="flex items-start gap-2">

                    {providerInfo.unavailable ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    ) : providerInfo.demo ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    )}

                    <div>

                      <p className="text-[10px] font-mono font-bold uppercase">
                        {providerInfo.unavailable
                          ? 'Vision Unavailable'
                          : providerInfo.demo
                            ? 'Demo Processing'
                            : 'Processing Source'}
                      </p>

                      <p className="text-[10px] opacity-60 mt-0.5">
                        {providerInfo.description}
                      </p>

                    </div>

                  </div>

                </div>
              )}

            {isProcessing ? (
              <div className="py-16 text-center space-y-3">

                <RefreshCcw className="w-8 h-8 animate-spin mx-auto opacity-60" />

                <p className="text-xs font-mono font-bold uppercase">
                  Extracting Visual Details...
                </p>

                <p className="text-[10px] opacity-50">
                  Reviewing image content before presenting results.
                </p>

              </div>
            ) : ocrResult?.error ? (
              <div className="py-12 text-center space-y-3">

                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />

                <p className="text-xs font-mono font-bold uppercase">
                  Image Analysis Failed
                </p>

                <p className="text-xs opacity-60">
                  {ocrResult.error}
                </p>

              </div>
            ) : !ocrResult ? (
              <div className="py-16 text-center space-y-2 opacity-50">

                <FileText className="w-8 h-8 mx-auto" />

                <p className="text-xs font-mono font-bold uppercase">
                  No image analyzed yet
                </p>

                <p className="text-[11px]">
                  Capture a photo or select a sample image on the left.
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {/* ================================================= */}
                {/* QUEUE */}
                {/* ================================================= */}

                {activeSubTab === 'queue' && (
                  normalizedQueueDetails ? (
                    <div className="space-y-3">

                      <div
                        className={`p-5 rounded-2xl border-4 ${borderTone} ${cardInnerBg} text-center space-y-2`}
                      >

                        <span className="text-[10px] font-mono font-bold uppercase opacity-60 block">
                          TOKEN NUMBER
                        </span>

                        <div className="text-4xl font-black">
                          {
                            normalizedQueueDetails.tokenNumber
                          }
                        </div>

                        <div className="text-sm font-bold opacity-80">
                          {
                            normalizedQueueDetails.counterNumber
                          }
                        </div>

                        <div className="text-xs font-mono opacity-60">
                          {
                            normalizedQueueDetails.dateTime
                          }
                        </div>

                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${borderTone} ${cardInnerBg} text-xs space-y-1`}
                      >

                        <span className="font-mono font-bold opacity-70 block">
                          Instructions:
                        </span>

                        <p className="font-bold">
                          {
                            normalizedQueueDetails.instructions
                          }
                        </p>

                      </div>

                      <button
                        onClick={handleSaveToQueue}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
                      >

                        <BellRing className="w-4 h-4" />

                        <span>
                          Transfer to Queue Companion (/queue-companion)
                        </span>

                      </button>

                      {savedToQueueMsg && (
                        <p className="text-xs font-mono font-bold text-green-600 dark:text-green-400 text-center">
                          ✓ Token saved to Queue Companion!
                        </p>
                      )}

                    </div>
                  ) : (
                    <div
                      className={`p-5 rounded-2xl border ${borderTone} ${cardInnerBg} space-y-2`}
                    >

                      <p className="text-xs font-mono font-bold uppercase">
                        No queue information detected
                      </p>

                      <p className="text-[11px] opacity-60">
                        This image does not appear to contain a visible
                        token, counter, department, or room number.
                      </p>

                      {extractedText && (
                        <p className="text-xs font-mono opacity-70 whitespace-pre-wrap pt-2">
                          {extractedText}
                        </p>
                      )}

                    </div>
                  )
                )}

                {/* ================================================= */}
                {/* OCR */}
                {/* ================================================= */}

                {activeSubTab === 'ocr' && (
                  extractedText ? (
                    <div className="space-y-3">

                      <label className="text-xs font-mono font-bold uppercase opacity-70">
                        Extracted Text (Editable for Verification):
                      </label>

                      <textarea
                        value={editableText}
                        onChange={(event) =>
                          setEditableText(
                            event.target.value
                          )
                        }
                        rows={10}
                        className={`w-full p-3 font-mono text-xs font-bold border rounded-xl outline-none ${cardInnerBg} ${borderTone}`}
                      />

                      <button
                        onClick={handleCopyText}
                        className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${cardInnerBg} ${borderTone}`}
                      >

                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}

                        <span>
                          {copied
                            ? 'Copied'
                            : 'Copy Text'}
                        </span>

                      </button>

                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-dashed opacity-60 text-xs">
                      No readable text was detected in this image.
                    </div>
                  )
                )}

                {/* ================================================= */}
                {/* DOCUMENT */}
                {/* ================================================= */}

                {activeSubTab === 'document' && (
                  hasDocumentInformation ? (
                    <div className="space-y-3">

                      <div
                        className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
                      >

                        <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                          Document Type
                        </span>

                        <p className="text-sm font-black capitalize">
                          {String(
                            normalizedDocumentBreakdown.documentCategory ||
                              detectedType
                          ).replaceAll('_', ' ')}
                        </p>

                      </div>

                      {normalizedDocumentBreakdown.plainSummary && (
                        <div
                          className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
                        >

                          <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                            Summary
                          </span>

                          <p className="text-sm font-black">
                            {
                              normalizedDocumentBreakdown.plainSummary
                            }
                          </p>

                        </div>
                      )}

                      {/* Merchant / organization */}
                      {merchant && (
                        <div
                          className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                        >

                          <span className="opacity-60 block text-[10px] uppercase">
                            Merchant / Organization
                          </span>

                          <span className="font-bold text-sm">
                            {merchant}
                          </span>

                        </div>
                      )}

                      {/* Bill / Invoice / Order */}
                      {documentNumber && (
                        <div
                          className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                        >

                          <span className="opacity-60 block text-[10px] uppercase">
                            Document / Order Number
                          </span>

                          <span className="font-bold text-sm">
                            {documentNumber}
                          </span>

                        </div>
                      )}

                      {/* Service / table / cashier */}
                      {(serviceType ||
                        tableNumber ||
                        cashier) && (
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">

                          {serviceType && (
                            <div
                              className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                            >

                              <span className="opacity-60 block text-[10px]">
                                Service
                              </span>

                              <span className="font-bold">
                                {serviceType}
                              </span>

                            </div>
                          )}

                          {tableNumber && (
                            <div
                              className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                            >

                              <span className="opacity-60 block text-[10px]">
                                Table
                              </span>

                              <span className="font-bold">
                                {tableNumber}
                              </span>

                            </div>
                          )}

                          {cashier && (
                            <div
                              className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                            >

                              <span className="opacity-60 block text-[10px]">
                                Cashier
                              </span>

                              <span className="font-bold">
                                {cashier}
                              </span>

                            </div>
                          )}

                        </div>
                      )}

                      {/* Dates / times */}
                      {(dates.length > 0 ||
                        times.length > 0) && (
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">

                          <div
                            className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                          >

                            <span className="opacity-60 block text-[10px]">
                              Dates
                            </span>

                            <span className="font-bold">
                              {dates.join(', ') ||
                                'None'}
                            </span>

                          </div>

                          <div
                            className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                          >

                            <span className="opacity-60 block text-[10px]">
                              Times
                            </span>

                            <span className="font-bold">
                              {times.join(', ') ||
                                'None'}
                            </span>

                          </div>

                        </div>
                      )}

                      {/* Amounts */}
                      {(subtotal ||
                        tax ||
                        discount ||
                        totalAmount ||
                        amounts.length > 0) && (
                        <div
                          className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
                        >

                          <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                            Amounts
                          </span>

                          {subtotal && (
                            <div className="flex justify-between text-xs">
                              <span>Subtotal</span>
                              <strong>
                                {subtotal}
                              </strong>
                            </div>
                          )}

                          {tax && (
                            <div className="flex justify-between text-xs">
                              <span>Tax</span>
                              <strong>
                                {tax}
                              </strong>
                            </div>
                          )}

                          {discount && (
                            <div className="flex justify-between text-xs">
                              <span>Discount</span>
                              <strong>
                                {discount}
                              </strong>
                            </div>
                          )}

                          {amounts.length > 0 && (
                            <div className="text-xs space-y-1">
                              {amounts.map(
                                (amount, index) => (
                                  <div
                                    key={index}
                                    className="opacity-80"
                                  >
                                    {typeof amount === 'object'
                                      ? JSON.stringify(amount)
                                      : String(amount)}
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {totalAmount && (
                            <div className="flex justify-between pt-2 border-t border-dashed text-sm font-black">
                              <span>Total</span>
                              <span>
                                {totalAmount}
                              </span>
                            </div>
                          )}

                        </div>
                      )}

                      {/* Line items */}
                      {items.length > 0 && (
                        <div
                          className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
                        >

                          <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                            Items / Services
                          </span>

                          <div className="space-y-2">

                            {items.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="text-xs border-b border-dashed pb-2 last:border-0"
                                >

                                  {typeof item === 'object' ? (
                                    <div className="space-y-0.5">

                                      <div className="font-bold">
                                        {item.name ||
                                          item.description ||
                                          item.item ||
                                          `Item ${index + 1}`}
                                      </div>

                                      <div className="opacity-60">
                                        {item.quantity &&
                                          `Qty: ${item.quantity} `}
                                        {item.unit_price &&
                                          ` · Unit: ${item.unit_price} `}
                                        {item.unitPrice &&
                                          ` · Unit: ${item.unitPrice} `}
                                        {item.amount &&
                                          ` · Amount: ${item.amount}`}
                                      </div>

                                    </div>
                                  ) : (
                                    String(item)
                                  )}

                                </div>
                              )
                            )}

                          </div>

                        </div>
                      )}

                      {/* Payment */}
                      {(paymentMethod ||
                        paymentStatus) && (
                        <div
                          className={`p-4 rounded-xl border ${borderTone} ${cardInnerBg} space-y-2`}
                        >

                          <span className="text-[10px] font-mono font-bold uppercase opacity-60">
                            Payment
                          </span>

                          {paymentMethod && (
                            <div className="flex justify-between text-xs">
                              <span>Method</span>
                              <strong>
                                {paymentMethod}
                              </strong>
                            </div>
                          )}

                          {paymentStatus && (
                            <div className="flex justify-between text-xs">
                              <span>Status</span>
                              <strong>
                                {paymentStatus}
                              </strong>
                            </div>
                          )}

                        </div>
                      )}

                      {/* Location */}
                      {location && (
                        <div
                          className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                        >

                          <span className="opacity-60 block text-[10px] uppercase">
                            Location
                          </span>

                          <span className="font-bold text-xs">
                            {location}
                          </span>

                        </div>
                      )}

                      {/* Contact */}
                      {contactDetails.length > 0 && (
                        <div
                          className={`p-3 rounded-lg border ${borderTone} ${cardInnerBg}`}
                        >

                          <span className="opacity-60 block text-[10px] uppercase">
                            Contact Details
                          </span>

                          <div className="text-xs font-bold space-y-1">

                            {contactDetails.map(
                              (item, index) => (
                                <div key={index}>
                                  {typeof item === 'object'
                                    ? JSON.stringify(item)
                                    : String(item)}
                                </div>
                              )
                            )}

                          </div>

                        </div>
                      )}

                      {/* Extracted text fallback */}
                      {extractedText && (
                        <details
                          className={`rounded-xl border ${borderTone} ${cardInnerBg}`}
                        >

                          <summary className="cursor-pointer p-3 text-xs font-mono font-bold uppercase">
                            View Full Extracted Text
                          </summary>

                          <pre className="p-3 text-[11px] font-mono whitespace-pre-wrap opacity-80">
                            {extractedText}
                          </pre>

                        </details>
                      )}

                      <button
                        onClick={handleSaveDocToPlanner}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${accentSolid} hover:opacity-90`}
                      >

                        <ListPlus className="w-4 h-4" />

                        <span>
                          Create Follow-Up Task
                        </span>

                      </button>

                    </div>
                  ) : (
                    <div
                      className={`p-5 rounded-xl border border-dashed ${borderTone} ${cardInnerBg} space-y-3`}
                    >

                      <FileText className="w-8 h-8 mx-auto opacity-50" />

                      <p className="text-xs font-mono font-bold uppercase text-center">
                        No structured document information detected
                      </p>

                      {extractedText && (
                        <pre className="text-[11px] font-mono whitespace-pre-wrap opacity-70">
                          {extractedText}
                        </pre>
                      )}

                    </div>
                  )
                )}

                {/* ================================================= */}
                {/* DESCRIPTION */}
                {/* ================================================= */}

                {activeSubTab === 'description' && (
                  <div
                    className={`p-5 rounded-2xl border ${borderTone} ${cardInnerBg} space-y-3`}
                  >

                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">

                      <ShieldCheck className="w-4 h-4" />

                      <span>
                        Privacy-Safe Objective Description
                      </span>

                    </div>

                    <p className="text-sm font-bold leading-relaxed">
                      {imageDescription ||
                        'No description available.'}
                    </p>

                    <p className="text-[10px] font-mono opacity-50">
                      Facial recognition and personal attribute
                      inferences are strictly disabled.
                    </p>

                  </div>
                )}

              </div>
            )}

          </div>

          <div
            className="pt-2 text-[10px] font-mono opacity-50 border-t border-dashed"
            style={{
              borderColor:
                isDarkTheme
                  ? '#AB92BF30'
                  : '#655A7C20'
            }}
          >
            Extracted information must be reviewed and confirmed
            by the user before creating records or taking
            follow-up actions.
          </div>

        </div>

      </div>
    </div>
  );
}