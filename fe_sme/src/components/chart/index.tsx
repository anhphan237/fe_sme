import clsx from 'clsx';
import { EChartsReactProps } from 'echarts-for-react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { AxisPointerComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { forwardRef, useRef } from 'react';

echarts.use([
    LegendComponent,
    TitleComponent,
    BarChart,
    CanvasRenderer,
    PieChart,
    LineChart,
    AxisPointerComponent,
    TooltipComponent,
    GridComponent,
    ToolboxComponent,
]);
echarts.registerTheme('customTheme', {
    textStyle: {
        fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'",
    },
});
type Props = EChartsReactProps;

const Index = forwardRef<any, Props>(({ className, ...rest }, ref) => {
    const chartRef = useRef<any>(null);
    return (
        <ReactEChartsCore
            ref={ref ?? chartRef}
            {...rest}
            echarts={echarts}
            notMerge={true}
            lazyUpdate={true}
            theme="customTheme"
            className={clsx('p-6 w-full', className)}
        />
    );
});

export default Index;
