import { useLocale } from '@/i18n';
import {
    DownloadOutlined,
    EyeOutlined,
    RotateLeftOutlined,
    RotateRightOutlined,
    SwapOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
} from '@ant-design/icons';
import Image, { ImageProps } from 'antd/es/image';
import { saveAs } from 'file-saver';
import React, { useEffect, useState } from 'react';

type Props = ImageProps & {
    previewMaskText?: string;
    ignorePreview?: boolean;
};

const Index: React.FC<Props> = ({ src, previewMaskText = 'global.image.preview_text', ignorePreview = false, ...rest }) => {
    const { t } = useLocale();
    const [visible, setVisible] = useState<boolean>(false);

    const onDownload = () => {
        if (!src) return;
        saveAs(src);
    };

    useEffect(() => {
        if (!ignorePreview) {
            setVisible(true);
        }
    }, [ignorePreview]);

    return (
        <>
            <Image
                {...rest}
                style={{ ...rest.style, display: ignorePreview ? 'none' : undefined }}
                src={src}
                fallback="src\assets\dashboard\placeholder.png"
                preview={{
                    mask: (
                        <div>
                            <EyeOutlined /> {t(previewMaskText)}
                        </div>
                    ),
                    visible: ignorePreview ? visible : undefined,
                    toolbarRender: (_, { transform: { scale }, actions: { onRotateLeft, onRotateRight, onZoomOut, onZoomIn, onFlipY, onFlipX } }) => (
                        <div className="flex items-center justify-center gap-8 text-white text-xl bg-[#00000078] py-3 px-6 rounded-[100px]">
                            <DownloadOutlined onClick={onDownload} />
                            <SwapOutlined rotate={90} onClick={onFlipY} />
                            <SwapOutlined onClick={onFlipX} />
                            <RotateLeftOutlined onClick={onRotateLeft} />
                            <RotateRightOutlined onClick={onRotateRight} />
                            <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                            <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                        </div>
                    ),
                    onVisibleChange: value => setVisible(value),
                }}
            />
            {ignorePreview && (
                <span className="hyper-link" onClick={() => setVisible(true)}>
                    {t(previewMaskText)}
                </span>
            )}
        </>
    );
};

export default Index;
