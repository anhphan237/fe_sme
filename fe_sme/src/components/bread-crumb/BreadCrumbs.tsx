import { useLocale } from '@/i18n';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BreadcrumbItemType, BreadcrumbSeparatorType } from 'antd/es/breadcrumb/Breadcrumb';
import { NavLink } from 'react-router';

import './BreadCrumbs.less';

const BreadCrumbs = ({ items }: { items: Partial<BreadcrumbItemType & BreadcrumbSeparatorType & { originalTitle?: string }>[] }) => {
    const { t } = useLocale();
    return (
        <div className="custom-breadcrumbs">
            <ul>
                <li className="breadcrumbs__item breadcrumbs__home">
                    <NavLink to="/" className="breadcrumbs__home-link">
                        <FontAwesomeIcon className="text-secondary" icon={faHouse} />
                        <span className="ml-1">{t('menu.home')}</span>
                    </NavLink>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="breadcrumbs__item" title={item.originalTitle}>
                        {item.title}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BreadCrumbs;
