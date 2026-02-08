import { AppRouters } from '@/constants';
import { useAppSelector } from '@/stores';
import {
    ApiOutlined,
    BarChartOutlined,
    CheckCircleOutlined,
    CloudOutlined,
    CodeOutlined,
    DollarOutlined,
    RocketOutlined,
    SafetyOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';

import AppLogo from '@/assets/logo/exps-removebg.png';
import whyChooseImg from '@assets/background/login-3.png';

import './index.less';

const HomePage = () => {
    const navigate = useNavigate();
    const { logged } = useAppSelector(state => state.user);
    const { menuList } = useAppSelector(state => state.user);

    useEffect(() => {
        if (logged && menuList?.length) {
            navigate(menuList[0].path);
        }
    }, [logged, menuList, navigate]);

    const handleLogin = () => {
        navigate(AppRouters.LOGIN);
    };

    return (
        <div className="homepage-container">
            <header className="homepage-header">
                <div className="header-content">
                    <div className="logo">
                        <img src={AppLogo} alt="EXPS Logo" />
                        <div className="logo-text-wrapper">
                            <span className="logo-text">EXPS Software</span>
                            <span className="logo-subtitle">Management System</span>
                        </div>
                    </div>
                    <nav className="nav-menu">
                        <a className="nav-link">Trang chủ</a>
                        <a className="nav-link">Giải pháp</a>
                        <a className="nav-link">Về chúng tôi</a>
                        <BaseButton type="primary" onClick={handleLogin} label="Đăng nhập" className="login-button" />
                    </nav>
                </div>
            </header>

            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <RocketOutlined className="badge-icon" />
                        <span>Giải pháp quản lý toàn diện</span>
                    </div>
                    <h1 className="hero-title">
                        Hệ thống quản lý
                        <br />
                        <span className="hero-highlight">doanh nghiệp thông minh</span>
                    </h1>
                    <p className="hero-description">
                        Tối ưu hóa quy trình vận hành, nâng cao hiệu suất làm việc và phát triển bền vững cùng EXPS Software
                    </p>
                    <div className="hero-buttons">
                        <BaseButton type="primary" size="large" onClick={handleLogin} label="Bắt đầu ngay" />
                        <BaseButton size="large" onClick={handleLogin} label="Tìm hiểu thêm" />
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <CheckCircleOutlined className="stat-icon" />
                            <span className="stat-value">99.9%</span>
                            <span className="stat-label">Uptime</span>
                        </div>
                        <div className="stat-item">
                            <TeamOutlined className="stat-icon" />
                            <span className="stat-value">500+</span>
                            <span className="stat-label">Khách hàng</span>
                        </div>
                        <div className="stat-item">
                            <SafetyOutlined className="stat-icon" />
                            <span className="stat-value">ISO</span>
                            <span className="stat-label">Chứng nhận</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="services-section">
                <div className="section-header">
                    <span className="section-badge">Dịch vụ của chúng tôi</span>
                    <h2>Giải pháp toàn diện cho doanh nghiệp</h2>
                    <p>Các tính năng được thiết kế để đáp ứng mọi nhu cầu quản lý của bạn</p>
                </div>

                <div className="services-grid">
                    <div className="service-card">
                        <div className="service-icon">
                            <ShoppingCartOutlined />
                        </div>
                        <h3>Quản lý bán hàng</h3>
                        <p>Tự động hóa quy trình bán hàng từ báo giá đến thanh toán, tối ưu doanh thu</p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon">
                            <TeamOutlined />
                        </div>
                        <h3>Quản lý khách hàng (CRM)</h3>
                        <p>Xây dựng mối quan hệ bền vững với khách hàng qua hệ thống CRM hiện đại</p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon">
                            <BarChartOutlined />
                        </div>
                        <h3>Báo cáo & Phân tích</h3>
                        <p>Thông tin chi tiết theo thời gian thực để đưa ra quyết định chính xác</p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon">
                            <ShopOutlined />
                        </div>
                        <h3>Quản lý kho vận</h3>
                        <p>Kiểm soát tồn kho, theo dõi xuất nhập hàng hóa một cách hiệu quả</p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon">
                            <DollarOutlined />
                        </div>
                        <h3>Quản lý tài chính</h3>
                        <p>Quản lý thu chi, công nợ và báo cáo tài chính chuyên nghiệp</p>
                    </div>

                    <div className="service-card">
                        <div className="service-icon">
                            <SafetyOutlined />
                        </div>
                        <h3>Bảo mật & Phân quyền</h3>
                        <p>Hệ thống bảo mật đa lớp, phân quyền chi tiết theo vai trò</p>
                    </div>
                </div>
            </section>

            <section className="why-choose-section">
                <div className="why-choose-content">
                    <div className="why-choose-text">
                        <span className="section-badge">Tại sao chọn chúng tôi</span>
                        <h2>Đối tác tin cậy cho sự phát triển</h2>
                        <p>
                            EXPS Software với hơn 10 năm kinh nghiệm trong lĩnh vực phát triển phần mềm, chúng tôi cam kết mang đến những giải pháp
                            công nghệ tốt nhất cho doanh nghiệp.
                        </p>
                        <div className="why-list">
                            <div className="why-item">
                                <CloudOutlined className="why-icon" />
                                <div>
                                    <h4>Công nghệ hiện đại</h4>
                                    <p>Áp dụng các công nghệ tiên tiến nhất</p>
                                </div>
                            </div>
                            <div className="why-item">
                                <ApiOutlined className="why-icon" />
                                <div>
                                    <h4>Tích hợp linh hoạt</h4>
                                    <p>Dễ dàng kết nối với các hệ thống khác</p>
                                </div>
                            </div>
                            <div className="why-item">
                                <CodeOutlined className="why-icon" />
                                <div>
                                    <h4>Tùy chỉnh cao</h4>
                                    <p>Phát triển theo nhu cầu riêng biệt</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src={whyChooseImg} className="w-full h-auto object-cover rounded-lg" />
                </div>
            </section>

            <section className="cta-section">
                <div className="cta-content">
                    <h2>Sẵn sàng chuyển đổi số?</h2>
                    <p>Bắt đầu hành trình số hóa doanh nghiệp của bạn ngay hôm nay</p>
                    <BaseButton type="primary" size="large" onClick={handleLogin} label="Dùng thử miễn phí" />
                </div>
            </section>

            <footer className="homepage-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <div className="footer-logo">
                            <img src={AppLogo} alt="EXPS Logo" />
                            <span>EXPS Software</span>
                        </div>
                        <p>Giải pháp phần mềm quản lý doanh nghiệp toàn diện</p>
                    </div>
                    <div className="footer-section">
                        <h4>Liên hệ</h4>
                        <p>Email: contact@exps.vn</p>
                        <p>Hotline: +84 92 388 3868</p>
                    </div>
                    <div className="footer-section">
                        <h4>Công ty</h4>
                        <p>Về chúng tôi</p>
                        <p>Dịch vụ</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 EXPS Software. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
